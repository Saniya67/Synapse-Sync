import React from 'react';

function Message({ text, fromUser }) {
  return (
    <div className={`message ${fromUser ? 'message-user' : 'message-bot'}`}>
      {typeof text === 'string' ? text : text}
    </div>
  );
}

export default Message;
