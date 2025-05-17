import { Box } from "@chakra-ui/react";
import axios from "axios";
import { MDBCard, MDBCardBody, MDBCardHeader, MDBIcon } from "mdb-react-ui-kit";
import React, { useEffect, useRef, useState, forwardRef, useImperativeHandle } from "react";
import Loading from "../resources/Loading";
import { CheckIcon } from "@chakra-ui/icons";
import { Text } from "@chakra-ui/react";

const FetchChat = forwardRef(({ id, toData, to }, ref) => {
  const authPicture = localStorage.getItem("authpicture");
  const authName = localStorage.getItem("authname");
  const authemail = localStorage.getItem("authemail");
  const authToken = localStorage.getItem("authToken");
  const [messages, setMessages] = useState([]);
  const [pendingMessages, setPendingMessages] = useState([]);
  const [hasNewMessages, setHasNewMessages] = useState(false);
  const messageContainerRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userScrolled, setUserScrolled] = useState(false);
  const [isPolling, setIsPolling] = useState(true);
  const lastFetchTimeRef = useRef(Date.now());

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const options = {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    };
    return date.toLocaleDateString("en-US", options);
  };

  // Handle adding a pending message
  const handleMessageSent = (pendingMessage, messageIdToRemove) => {
    if (messageIdToRemove) {
      // Remove a specific pending message (in case of error)
      setPendingMessages(prev => prev.filter(msg => msg._id !== messageIdToRemove));
      return;
    }
    
    if (pendingMessage) {
      // Immediately add the new pending message for instant feedback
      setPendingMessages(prev => [...prev, pendingMessage]);
      
      // Scroll to bottom immediately without delay
      setTimeout(() => scrollToBottom(), 0);
      
      // Trigger an immediate fetch to try to get the real message
      fetchNewMessages();
    }
  };

  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    handleMessageSent
  }));

  // Define fetchNewMessages outside useEffect to make it reusable
  const fetchNewMessages = async () => {
    // Throttle fetches to prevent excessive API calls
    const now = Date.now();
    if (now - lastFetchTimeRef.current < 500) {
      return; // Skip if less than 500ms since last fetch
    }
    lastFetchTimeRef.current = now;
    
    try {
      const response = await axios.get("https://retrend-final.onrender.com/api/new-messages", {
        params: { id, to },
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
      const serverMessages = response.data;
      
      // If we have any server messages, remove pending messages that have been confirmed
      if (serverMessages.length > 0) {
        // Remove pending messages that now exist in server data
        setPendingMessages(prev => {
          // Keep only pending messages whose content isn't in the server response
          const filteredPending = prev.filter(pendingMsg => {
            // Check if this pending message content now exists in the server data
            const matchingServerMsg = serverMessages.find(
              serverMsg => 
                serverMsg.from === pendingMsg.from && 
                serverMsg.message === pendingMsg.message &&
                Math.abs(new Date(serverMsg.createdAt) - new Date(pendingMsg.createdAt)) < 10000 // Within 10 seconds
            );
            // If we found a match, this pending message should be removed
            return !matchingServerMsg;
          });
          
          return filteredPending;
        });
      }
      
      // Update the confirmed messages from the server
      setMessages(serverMessages);
      setHasNewMessages(true);
      setIsLoading(false);

      // Mark messages as read if they're sent to the current user
      if (serverMessages.length > 0) {
        const unreadMessages = serverMessages.filter(
          msg => msg.to === authemail && !msg.isRead
        );
        
        if (unreadMessages.length > 0) {
          try {
            await axios.post("https://retrend-final.onrender.com/mark-messages-read", 
              { messageIds: unreadMessages.map(msg => msg._id) },
              {
                headers: {
                  Authorization: `Bearer ${authToken}`,
                },
              }
            );
          } catch (error) {
            console.error("Error marking messages as read:", error);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      // Initial fetch
      fetchNewMessages();

      // Set up polling with a shorter interval (1.5 seconds instead of 3)
      const intervalId = setInterval(() => {
        if (isPolling) {
          fetchNewMessages();
        }
      }, 1500);

      return () => {
        clearInterval(intervalId);
      };
    }
  }, [id, authToken, to, authemail, isPolling]);

  useEffect(() => {
    if (hasNewMessages && !userScrolled) {
      // Use setTimeout with 0ms to push scrollToBottom to the next event cycle
      // This ensures the DOM has been updated with new messages
      setTimeout(() => scrollToBottom(), 0);
      setHasNewMessages(false);
    }
  }, [hasNewMessages, userScrolled]);

  // Handle scroll events
  const handleScroll = () => {
    if (!messageContainerRef.current) return;
    
    const { scrollTop, scrollHeight, clientHeight } = messageContainerRef.current;
    const isAtBottom = Math.abs(scrollHeight - scrollTop - clientHeight) < 10;
    
    // Set userScrolled flag when user scrolls up
    if (!isAtBottom) {
      setUserScrolled(true);
    } else {
      setUserScrolled(false);
    }
  };

  const scrollToBottom = () => {
    if (messageContainerRef.current) {
      messageContainerRef.current.scrollTop = messageContainerRef.current.scrollHeight;
    }
  };

  // Component visibility handling - pause polling when tab is not visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsPolling(!document.hidden);
      // If becoming visible, do an immediate fetch
      if (!document.hidden) {
        fetchNewMessages();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  if (isLoading) {
    return <Loading />;
  }

  // Combine confirmed messages with pending messages for display
  const allMessages = [...messages, ...pendingMessages].sort((a, b) => 
    new Date(a.createdAt) - new Date(b.createdAt)
  );

  return (
    <Box
      className="message-container"
      maxH="500px" // Increased height from 400px to 500px
      overflowY="auto"
      ref={messageContainerRef}
      onScroll={handleScroll}
      sx={{
        scrollBehavior: "smooth",
        '&::-webkit-scrollbar': {
          width: '8px',
        },
        '&::-webkit-scrollbar-thumb': {
          background: '#25D366',
          borderRadius: '8px',
        }
      }}
    >
      {allMessages.length === 0 ? (
        <div className="no-messages">
          <p>No messages yet. Start a conversation!</p>
        </div>
      ) : (
        allMessages.map((message, index) => (
          <div key={message._id || index} className={`message-wrapper ${message.from === authemail ? 'sent' : 'received'}`}>
            {message.from === authemail ? (
              <li className="d-flex justify-content-end mb-4">
                <div className={`message-bubble-sent ${message.isPending ? 'message-pending' : ''}`}>
                  <p className="mb-0">{message.message}</p>
                  <div className="message-timestamp">
                    {formatTime(message.createdAt)}
                    <span className="message-status ml-1">
                      {message.isPending ? (
                        <span className="sending-indicator">
                          <div className="sending-dots">
                            <div className="sending-dot"></div>
                            <div className="sending-dot"></div>
                            <div className="sending-dot"></div>
                          </div>
                        </span>
                      ) : message.isRead ? (
                        <span className="blue-tick">
                          <CheckIcon color="blue.500" boxSize={3} mr={1} />
                          <CheckIcon color="blue.500" boxSize={3} />
                        </span>
                      ) : (
                        <span className="gray-tick">
                          <CheckIcon color="gray.500" boxSize={3} mr={1} />
                          <CheckIcon color="gray.500" boxSize={3} />
                        </span>
                      )}
                    </span>
                  </div>
                </div>
              </li>
            ) : (
              <li className="d-flex mb-4">
                <img
                  src={toData.picture}
                  alt="avatar"
                  className="rounded-circle d-flex align-self-start me-3 shadow-1-strong"
                  width="40"
                />
                <div className="message-bubble-received">
                  <p className="mb-0">{message.message}</p>
                  <div className="message-timestamp">
                    {formatTime(message.createdAt)}
                  </div>
                </div>
              </li>
            )}
          </div>
        ))
      )}
    </Box>
  );
});

export default FetchChat;
