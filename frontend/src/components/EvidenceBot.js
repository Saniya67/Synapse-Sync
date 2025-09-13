import React, { useState } from 'react';
import { Form, Button } from 'react-bootstrap';

function EvidenceBot({ chatData, updateChat }) {
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (!input.trim()) return;

    const updatedChat = { ...chatData };
    updatedChat.messages.push({ type: 'question', text: input });
    updateChat(updatedChat);
    setInput('');

    setTimeout(() => {
      const botAnswer = `Here is the evidence response for: "${input}"`;
      const newUpdatedChat = { ...updatedChat };
      newUpdatedChat.messages.push({ type: 'answer', text: botAnswer });
      updateChat(newUpdatedChat);
    }, 1000);
  };

  return (
    <div className="chat-area">
      <div className="list-group-chat">
        {chatData.messages.map((msg, idx) => (
          <div
            className={`message ${msg.type === 'question' ? 'message-user' : 'message-bot'}`}
            key={idx}
          >
            {msg.text}
          </div>
        ))}
      </div>

      <Form className="form-chat" onSubmit={(e) => { e.preventDefault(); handleSend(); }}>
        <input
          className="form-control-chat"
          type="text"
          value={input}
          placeholder="Ask about evidence..."
          onChange={(e) => setInput(e.target.value)}
        />
        <Button type="submit" className="btn-chat">Send</Button>
      </Form>
    </div>
  );
}

export default EvidenceBot;
