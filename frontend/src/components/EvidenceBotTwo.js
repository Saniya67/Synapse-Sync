import React, { useState } from 'react';
import { Form, Button } from 'react-bootstrap';
import { FaEdit } from 'react-icons/fa';

function EvidenceBotTwo({ chatData, updateChat }) {
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

    // Add or edit question
    if (index === null) {
      updatedChat.messages.push({ type: 'question', text: questionText });
    } else {
      updatedChat.messages[index].text = questionText;
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
      // GET request to API
      const response = await fetch(`${backendUrl}/chat?question=${encodeURIComponent(questionText)}`);
      const data = await response.json();

      const firstPR = data.prs?.[0] || {};
      let botMessage;

      if (data.prs && data.prs.length > 0) {
        if (firstPR.merged_by) {
          botMessage = {
            type: 'answer',
            text: `PR titled "${firstPR.title}" was merged by ${firstPR.merged_by}.`,
          };
        } else {
          botMessage = {
            type: 'answer',
            text: `PR titled "${firstPR.title}" has not been merged yet.`,
          };
        }
      } else {
        botMessage = { type: 'answer', text: 'No PRs found for this query.' };
      }

      // Add new answer
      if (answerIndex !== null && answerIndex >= 0) {
        updatedChat.messages.splice(answerIndex, 0, botMessage);
      } else {
        updatedChat.messages.push(botMessage);
      }

      updateChat(updatedChat);
    } catch (error) {
      updatedChat.messages.push({ type: 'answer', text: 'Error fetching answer.' });
      updateChat(updatedChat);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="chat-area">
      <div className="list-group-chat">
        {chatData.messages.map((msg, idx) => (
          <div
            key={idx}
            className={`message ${msg.type === 'question' ? 'message-user' : 'message-bot'}`}
            style={{
              display: 'flex',
              justifyContent: msg.type === 'question' ? 'flex-start' : 'flex-end',
              marginBottom: '10px',
            }}
          >
            {/* Question */}
            {msg.type === 'question' && editingIndex === idx ? (
              <div className="edit-question">
                <input
                  type="text"
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  className="form-control"
                  style={{ marginRight: '5px' }}
                />
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => handleSend(editText, idx)}
                  disabled={loading}
                >
                  Send
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setEditingIndex(null)}
                  style={{ marginLeft: '5px' }}
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
                  style={{ marginLeft: '5px' }}
                >
                  <FaEdit />
                </Button>
              </div>
            ) : null}

            {/* Answer */}
            {msg.type === 'answer' && (
              <span
                style={{
                  backgroundColor: '#f1f0f0',
                  padding: '8px 12px',
                  borderRadius: '10px',
                  maxWidth: '70%',
                  wordBreak: 'break-word',
                }}
              >
                {msg.text}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Input for new question */}
      {editingIndex === null && (
        <Form
          className="form-chat"
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          style={{ display: 'flex', marginTop: '10px' }}
        >
          <input
            className="form-control-chat"
            type="text"
            value={input}
            placeholder="Ask about PRs or evidence..."
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
            style={{ flex: 1, marginRight: '5px' }}
          />
          <Button type="submit" className="btn-chat" disabled={loading}>
            {loading ? 'Loading...' : 'Send'}
          </Button>
        </Form>
      )}
    </div>
  );
}

export default EvidenceBotTwo;
