import React, { useState } from 'react';
import { Form, Button, Table, Card } from 'react-bootstrap';
import axios from 'axios';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { FaFileExcel, FaFilePdf, FaFileCsv, FaEdit } from 'react-icons/fa';

function EvidenceBot({ chatData, updateChat }) {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [editText, setEditText] = useState('');
  const backendUrl = process.env.REACT_APP_BACKEND_URL;

  const handleSend = async (question = null, index = null) => {
    const questionText = question || input;
    if (!questionText.trim()) return;

    let updatedChat = { ...chatData };
    let answerIndex = null;

    if (index === null) {
      // New question
      updatedChat.messages.push({ type: 'question', text: questionText });
    } else {
      // Editing existing question
      updatedChat.messages[index].text = questionText;

      // Find the old answer for this question
      answerIndex = updatedChat.messages.findIndex(
        (msg, i) => i > index && msg.type !== 'question'
      );
      if (answerIndex !== -1) {
        updatedChat.messages.splice(answerIndex, 1); // Remove old answer
      }
    }

    updateChat(updatedChat);
    setLoading(true);
    if (!question) setInput('');
    setEditingIndex(null);
    setEditText('');

    try {
      const formData = new FormData();
      formData.append('question', questionText);

      const response = await axios.post(
        `${backendUrl}/ask`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );

      const data = response.data;
      const firstRow = data.result_table?.[0] || {};

      let botMessage;
      if ('definition' in firstRow || 'Definition' in firstRow || 'RAG' in firstRow || 'Rag' in firstRow) {
        botMessage = { type: 'answer', text: firstRow.definition || firstRow.Definition || firstRow.RAG || firstRow.Rag };
      } else if (data.result_table && data.result_table.length > 0) {
        botMessage = { type: 'table', text: data.result_table, query: data.query };
      } else {
        botMessage = { type: 'answer', text: 'No results found for this query.' };
      }

      // Add new answer (overwrite if editing)
      updatedChat = { ...updatedChat };
      if (answerIndex !== null && answerIndex >= 0) {
        updatedChat.messages.splice(answerIndex, 0, botMessage);
      } else {
        updatedChat.messages.push(botMessage);
      }
      updateChat(updatedChat);

    } catch (error) {
      updatedChat = { ...updatedChat };
      updatedChat.messages.push({ type: 'answer', text: 'Error fetching answer.' });
      updateChat(updatedChat);
    } finally {
      setLoading(false);
    }
  };

  // Export Excel
  const exportToExcel = (tableData, filename = 'report.xlsx') => {
    const ws = XLSX.utils.json_to_sheet(tableData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    XLSX.writeFile(wb, filename);
  };

  // Export PDF
  const exportToPDF = (tableData, title = 'Report') => {
    const doc = new jsPDF();
    doc.text(title, 14, 20);
    autoTable(doc, {
      head: [Object.keys(tableData[0])],
      body: tableData.map((row) => Object.values(row)),
      startY: 30,
    });
    doc.save(`${title}.pdf`);
  };

  // Export CSV
  const exportToCSV = (tableData, filename = 'report.csv') => {
    if (!tableData || tableData.length === 0) return;
    const keys = Object.keys(tableData[0]);
    const csvContent =
      keys.join(',') +
      '\n' +
      tableData.map((row) => keys.map((k) => `"${row[k] ?? ''}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', filename);
    link.click();
  };

  return (
    <div className="chat-area">
      <div className="list-group-chat">
        {chatData.messages.map((msg, idx) => (
          <div
            className={`message ${msg.type === 'question' ? 'message-user' : 'message-bot'}`}
            key={idx}
          >
            {/* Question */}
            {msg.type === 'question' && editingIndex === idx ? (
              <div className="edit-question">
                <input
                  type="text"
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  className="form-control"
                />
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => handleSend(editText, idx)}
                  disabled={loading}
                  style={{ marginRight: '5px', marginTop: '5px' }}
                >
                  Send
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setEditingIndex(null)}
                  style={{ marginTop: '5px' }}
                >
                  Cancel
                </Button>
              </div>
            ) : msg.type === 'question' ? (
              <div>
                <span>{msg.text}</span>
                <Button
                  size="sm"
                  variant="link"
                  onClick={() => {
                    setEditingIndex(idx);
                    setEditText(msg.text);
                  }}
                  style={{ marginLeft: '10px' }}
                >
                  <FaEdit />
                </Button>
              </div>
            ) : null}

            {/* Answer */}
            {msg.type === 'answer' && <span>{msg.text}</span>}

            {/* Table */}
            {msg.type === 'table' && (
              <Card style={{ marginBottom: '15px' }}>
                <Card.Body>
                  <div className="table-actions" style={{ margin: '5px 0' }}>
                    <Button
                      size="sm"
                      variant="success"
                      onClick={() => exportToExcel(msg.text)}
                      style={{ marginRight: '5px' }}
                    >
                      <FaFileExcel style={{ marginRight: '5px' }} />
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => exportToPDF(msg.text, msg.query)}
                      style={{ marginRight: '5px' }}
                    >
                      <FaFilePdf style={{ marginRight: '5px' }} />
                    </Button>
                    <Button
                      size="sm"
                      variant="info"
                      onClick={() => exportToCSV(msg.text)}
                    >
                      <FaFileCsv style={{ marginRight: '5px' }} />
                    </Button>
                  </div>
                  <Table striped bordered hover size="sm" responsive>
                    <thead>
                      <tr>
                        {Object.keys(msg.text[0]).map((key) => (
                          <th key={key}>{key}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {msg.text.map((row, i) => (
                        <tr key={i}>
                          {Object.keys(row).map((col) => (
                            <td key={col}>{row[col]}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </Card.Body>
              </Card>
            )}
          </div>
        ))}
      </div>

      {/* New question input */}
      {editingIndex === null && (
        <Form
          className="form-chat"
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
        >
          <input
            className="form-control-chat"
            type="text"
            value={input}
            placeholder="Ask about evidence..."
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
          />
          <Button type="submit" className="btn-chat" disabled={loading}>
            {loading ? 'Loading...' : 'Send'}
          </Button>
        </Form>
      )}
    </div>
  );
}

export default EvidenceBot;
