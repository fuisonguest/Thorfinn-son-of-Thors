import { useToast } from "@chakra-ui/react";
import axios from "axios";
import React, { useState, useEffect } from "react";
import { Form } from "react-bootstrap";
import { CheckIcon } from "@chakra-ui/icons";
import { v4 as uuidv4 } from 'uuid';

export default function SendChat({ id, to, onMessageSent }) {
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const authToken = localStorage.getItem("authToken");
  const authemail = localStorage.getItem("authemail");
  const toast = useToast();
  
  const handleMessageChange = (event) => {
    setMessage(event.target.value);
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (message && !isSending) {
      const messageText = message.trim();
      if (!messageText) return;
      
      // Create temporary pending message object
      const tempMessageId = uuidv4();
      const pendingMessage = {
        _id: tempMessageId,
        message: messageText,
        from: authemail,
        to: to,
        createdAt: new Date().toISOString(),
        isRead: false,
        isPending: true
      };
      
      // Clear the input field immediately
      setMessage("");
      
      // Optimistically add the message to the UI immediately
      if (onMessageSent) {
        onMessageSent(pendingMessage);
      }
      
      // Set sending state after UI update to prevent blocking
      setIsSending(true);
      
      try {
        const response = await axios.post(
          "https://retrend-final.onrender.com/sendMessage",
          { message: messageText, id, to },
          {
            headers: {
              Authorization: `Bearer ${authToken}`,
            },
          }
        );
        
        if (response.status === 200) {
          // Message sent successfully
          // The optimistic UI update is already done
        } else if (response.status === 201) {
          // Remove the pending message if there was an error
          if (onMessageSent) {
            onMessageSent(null, tempMessageId);
          }
          
          toast({
            title: "You cannot send Message",
            status: "error",
            duration: 3000,
            isClosable: true,
          });
        }
      } catch (error) {
        console.error("Error sending message:", error);
        
        // Remove the pending message if there was an error
        if (onMessageSent) {
          onMessageSent(null, tempMessageId);
        }
        
        toast({
          title: "Failed to send message",
          description: "Please try again",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      } finally {
        setIsSending(false);
      }
    }
  };
  
  const handleKeyDown = (e) => {
    // Send message on Enter key, but allow Shift+Enter for new line
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(e);
    }
  };
  
  return (
    <Form onSubmit={sendMessage} className="chat-input-container">
      <input
        type="text"
        className="chat-input"
        value={message}
        onChange={handleMessageChange}
        onKeyDown={handleKeyDown}
        placeholder="Type a message..."
        disabled={isSending}
      />
      {message.length > 0 && (
        <button 
          type="submit" 
          className={`send-btn ${isSending ? 'sending' : ''}`}
          disabled={isSending}
        >
          <i className={`fas ${isSending ? 'fa-spinner' : 'fa-paper-plane'}`}></i>
        </button>
      )}
    </Form>
  );
}

