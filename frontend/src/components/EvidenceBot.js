import React, { useState } from 'react';
import { Form, Button, Table, Card } from 'react-bootstrap';
import axios from 'axios';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable'; // Correct import for modern jspdf

function EvidenceBot({ chatData, updateChat }) {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  // Send user question to API
  const handleSend = async () => {
    if (!input.trim()) return;

    // Add user question
    const updatedChat = { ...chatData };
    updatedChat.messages.push({ type: 'question', text: input });
    updateChat(updatedChat);

    setLoading(true);
    setInput('');

    try {
      const formData = new FormData();
      formData.append('question', input);

      const response = await axios.post(
        'https://862637ef1af5.ngrok-free.app/ask',
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );

      const data = response.data;
      const firstRow = data.result_table?.[0] || {};

      let botMessage;

      if ('definition' in firstRow) {
        // Show definition text
        botMessage = { type: 'answer', text: firstRow.definition };
      } else if (data.result_table && data.result_table.length > 0) {
        // Show table
        botMessage = { type: 'table', text: data.result_table, query: data.query };
      } else {
        botMessage = { type: 'answer', text: 'No results found for this query.' };
      }

      const newUpdatedChat = { ...updatedChat };
      newUpdatedChat.messages.push(botMessage);
      updateChat(newUpdatedChat);

    } catch (error) {
      const newUpdatedChat = { ...updatedChat };
      newUpdatedChat.messages.push({ type: 'answer', text: 'Error fetching answer.' });
      updateChat(newUpdatedChat);
    } finally {
      setLoading(false);
    }
  };

  // Export table to Excel
  const exportToExcel = (tableData, filename = 'report.xlsx') => {
    const ws = XLSX.utils.json_to_sheet(tableData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    XLSX.writeFile(wb, filename);
  };

  // Export table to PDF
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

  return (
    <div className="chat-area">
      <div className="list-group-chat">
        {chatData.messages.map((msg, idx) => (
          <div
            className={`message ${msg.type === 'question' ? 'message-user' : 'message-bot'}`}
            key={idx}
          >
            {msg.type === 'question' && <span>{msg.text}</span>}
            {msg.type === 'answer' && <span>{msg.text}</span>}

            {msg.type === 'table' && (
              <Card style={{ marginBottom: '15px' }}>
                <Card.Body>
                  <strong>{msg.query}</strong>
                  <div className="table-actions" style={{ margin: '5px 0' }}>
                    <Button
                      size="sm"
                      variant="success"
                      onClick={() => exportToExcel(msg.text)}
                      style={{ marginRight: '5px' }}
                    >
                      Download Excel
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => exportToPDF(msg.text, msg.query)}
                    >
                      Download PDF
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
    </div>
  );
}

export default EvidenceBot;
