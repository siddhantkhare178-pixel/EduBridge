"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Send, Plus, Lightbulb, BookOpen, HelpCircle, MessageCircle, Loader2, Wifi, WifiOff, Clock } from "lucide-react"
import { useOffline } from "@/hooks/use-offline"
import { offlineManager } from "@/lib/offline-manager"

interface Message {
  id: number
  role: "user" | "assistant"
  content: string
  timestamp: Date
  cached?: boolean
}

interface AITutorProps {
  onNavigate: (page: string) => void
}

export function AITutor({}: AITutorProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState("")
  const [selectedMode, setSelectedMode] = useState("general")
  const [isLoading, setIsLoading] = useState(false)
  const [recentChats, setRecentChats] = useState<Array<{ title: string, date: string, messages: Message[] }>>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { isOnline } = useOffline()

  // Initialize messages based on selected mode
  useEffect(() => {
    setMessages(getInitialMessages(selectedMode))
  }, [selectedMode])

  // Load recent chats and current session from localStorage on component mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Load recent chats
      const saved = localStorage.getItem('ai-tutor-chats')
      if (saved) {
        try {
          const parsedChats = JSON.parse(saved);

          // Validate the structure of loaded chats
          if (Array.isArray(parsedChats)) {
            const validChats = parsedChats.filter(chat =>
              chat &&
              typeof chat.title === 'string' &&
              typeof chat.date === 'string' &&
              Array.isArray(chat.messages)
            ).map(chat => ({
              ...chat,
              messages: chat.messages.map((msg: any) => ({
                ...msg,
                timestamp: typeof msg.timestamp === 'string' ? msg.timestamp : new Date(msg.timestamp).toISOString()
              }))
            }));

            setRecentChats(validChats);
          } else {
            console.warn('Invalid chat data structure, clearing localStorage');
            localStorage.removeItem('ai-tutor-chats');
          }
        } catch (error) {
          console.error('Error loading saved chats:', error);
          // Clear corrupted data
          localStorage.removeItem('ai-tutor-chats');
        }
      }

      // Load current session
      const currentSession = localStorage.getItem('ai-tutor-current-session');
      if (currentSession) {
        try {
          const sessionData = JSON.parse(currentSession);
          if (sessionData.messages && Array.isArray(sessionData.messages) && sessionData.messages.length > 0) {
            const validMessages = sessionData.messages.map((msg: any) => ({
              ...msg,
              timestamp: new Date(msg.timestamp)
            }));
            setMessages(validMessages);
          }
          if (sessionData.mode) {
            setSelectedMode(sessionData.mode);
          }
        } catch (error) {
          console.error('Error loading current session:', error);
          localStorage.removeItem('ai-tutor-current-session');
        }
      }
    }
  }, [])

  // Auto-save current session when messages or mode change
  useEffect(() => {
    if (typeof window !== 'undefined' && messages.length > 0) {
      const sessionData = {
        messages: messages.map(msg => ({
          ...msg,
          timestamp: msg.timestamp.toISOString()
        })),
        mode: selectedMode,
        lastUpdated: new Date().toISOString()
      };

      try {
        localStorage.setItem('ai-tutor-current-session', JSON.stringify(sessionData));
      } catch (error) {
        console.error('Failed to save current session:', error);
      }
    }
  }, [messages, selectedMode])

  // Function to save current conversation to recent chats
  const saveCurrentConversation = useCallback(() => {
    try {
      // Only save if there are user messages
      if (messages.some(msg => msg.role === 'user')) {
        const firstUserMessage = messages.find(msg => msg.role === 'user')?.content || 'New Chat';
        const chatTitle = firstUserMessage.length > 30
          ? firstUserMessage.substring(0, 30) + '...'
          : firstUserMessage;

        // Ensure messages are properly serializable
        const serializableMessages = messages.map(msg => ({
          id: msg.id,
          role: msg.role,
          content: msg.content,
          timestamp: msg.timestamp,
          cached: msg.cached || false
        }));

        const newChat = {
          title: chatTitle,
          date: new Date().toLocaleDateString(),
          messages: serializableMessages
        };

        // Check if this conversation already exists in recent chats
        const existingChatIndex = recentChats.findIndex(chat =>
          chat.title === chatTitle && chat.messages.length === serializableMessages.length
        );

        let updatedChats;
        if (existingChatIndex >= 0) {
          // Update existing chat
          updatedChats = [...recentChats];
          updatedChats[existingChatIndex] = newChat;
        } else {
          // Add new chat
          updatedChats = [newChat, ...recentChats.slice(0, 4)]; // Keep only 5 recent chats
        }

        setRecentChats(updatedChats);

        // Save to localStorage
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem('ai-tutor-chats', JSON.stringify(updatedChats));
          } catch (storageError) {
            console.error('Failed to save chat to localStorage:', storageError);
          }
        }
      }
    } catch (error) {
      console.error('Error saving current conversation:', error);
    }
  }, [messages, recentChats]);

  // Save conversation before page unload (refresh/close)
  useEffect(() => {
    const handleBeforeUnload = () => {
      saveCurrentConversation();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', handleBeforeUnload);

      return () => {
        window.removeEventListener('beforeunload', handleBeforeUnload);
      };
    }
  }, [messages, recentChats, saveCurrentConversation]) // Dependencies to ensure we have latest data

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSendMessage = async () => {
    if (inputValue.trim() && !isLoading) {
      const userMessage: Message = {
        id: Date.now(),
        role: "user",
        content: inputValue.trim(),
        timestamp: new Date(),
      }

      const updatedMessages = [...messages, userMessage]
      setMessages(updatedMessages)
      const currentInput = inputValue.trim()
      setInputValue("")
      setIsLoading(true)

      try {
        let aiResponseContent = ""
        let cached = false

        // Try offline cache first
        const cachedResponse = await offlineManager.getCachedAIResponse(currentInput)

        if (cachedResponse) {
          aiResponseContent = cachedResponse
          cached = true
        } else if (isOnline) {
          // Try online API
          const apiMessages = updatedMessages.map(msg => ({
            role: msg.role,
            content: msg.content
          }))

          const response = await fetch('/api/ai-tutor', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              messages: apiMessages,
              mode: selectedMode
            }),
          })

          if (!response.ok) {
            throw new Error('Failed to get AI response')
          }

          const data = await response.json()
          aiResponseContent = data.message

          // Cache the response for offline use
          await offlineManager.cacheAIResponse(currentInput, aiResponseContent)
        } else {
          // Offline with no cache
          aiResponseContent = "I'm currently offline and don't have a cached response for that question. Please try again when you're back online, or ask something I might have answered before."
        }

        const aiResponse: Message = {
          id: Date.now() + 1,
          role: "assistant",
          content: aiResponseContent,
          timestamp: new Date(),
          cached
        }

        setMessages(prev => [...prev, aiResponse])
      } catch (error) {
        console.error('Error getting AI response:', error)
        let errorContent = "I'm sorry, I'm having trouble responding right now."

        if (!isOnline) {
          errorContent = "I'm currently offline and don't have a cached response for that question. Please try again when you're back online."
        } else if (error instanceof Error) {
          if (error.message.includes('API key')) {
            errorContent = "It looks like the AI service isn't configured properly. Please contact your administrator."
          } else if (error.message.includes('Failed to fetch')) {
            errorContent = "I'm having trouble connecting to the AI service. Please check your internet connection and try again."
          }
        }

        const errorMessage: Message = {
          id: Date.now() + 1,
          role: "assistant",
          content: errorContent,
          timestamp: new Date(),
        }
        setMessages(prev => [...prev, errorMessage])
      } finally {
        setIsLoading(false)
      }
    }
  }

  const handleNewChat = () => {
    try {
      // Save current conversation before starting new one
      saveCurrentConversation();

      // Clear current session and start fresh
      setMessages(getInitialMessages(selectedMode));
      setInputValue("");

      // Clear current session from localStorage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('ai-tutor-current-session');
      }
    } catch (error) {
      console.error('Error in handleNewChat:', error);
      // Still proceed with clearing the chat even if saving fails
      setMessages(getInitialMessages(selectedMode));
      setInputValue("");
    }
  }



  const loadChat = (chatMessages: Message[]) => {
    try {
      // Save current conversation before loading new one
      saveCurrentConversation();

      if (Array.isArray(chatMessages) && chatMessages.length > 0) {
        // Validate and sanitize messages
        const validMessages = chatMessages.map(msg => ({
          id: msg.id || Date.now() + Math.random(),
          role: msg.role || "assistant",
          content: msg.content || "",
          timestamp: msg.timestamp instanceof Date ? msg.timestamp : new Date(msg.timestamp || Date.now()),
          cached: msg.cached || false
        }));

        setMessages(validMessages);
        setInputValue(""); // Clear input when loading a chat
      } else {
        console.warn('Invalid chat messages provided to loadChat');
      }
    } catch (error) {
      console.error('Error in loadChat:', error);
      // Fallback to initial messages if loading fails
      setMessages(getInitialMessages(selectedMode));
    }
  }



  return (
    <div className="h-screen w-full bg-background flex flex-col overflow-hidden">
      {/* Mobile Layout */}
      <div className="lg:hidden flex flex-col h-full w-full">
        {/* Mobile Header with Mode Selection */}
        <div className="flex-shrink-0 p-3 border-b border-border bg-background">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
            {tutorModes.map((mode) => (
              <button
                key={mode.id}
                onClick={() => setSelectedMode(mode.id)}
                className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-full transition-colors text-xs whitespace-nowrap font-medium ${selectedMode === mode.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-foreground border border-border"
                  }`}
              >
                <mode.icon className="w-3 h-3 flex-shrink-0" />
                <span>{mode.name}</span>
              </button>
            ))}
          </div>
          <Button
            onClick={handleNewChat}
            className="w-full gap-2 bg-primary text-primary-foreground hover:bg-primary/90 text-sm mt-2"
            size="sm"
          >
            <Plus className="w-4 h-4" />
            New Chat
          </Button>
        </div>

        {/* Mobile Chat Area */}
        <div className="flex-1 flex flex-col min-h-0 bg-background">
          {/* Chat Header */}
          <div className="flex-shrink-0 p-3 border-b border-border">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-foreground truncate">
                {tutorModes.find((m) => m.id === selectedMode)?.name || "AI Tutor"}
              </h2>
              <Badge variant={isOnline ? "secondary" : "outline"} className="text-xs">
                {isOnline ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
              </Badge>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] px-3 py-2 rounded-lg ${message.role === "user"
                    ? "bg-primary text-primary-foreground rounded-br-sm"
                    : "bg-muted text-foreground rounded-bl-sm"
                    }`}
                >
                  <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <p className={`text-xs ${message.role === "user" ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                      {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                    {message.cached && (
                      <Badge variant="secondary" className="text-xs py-0 px-1">
                        <Clock className="h-2 w-2 mr-1" />
                        Cached
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="flex-shrink-0 p-3 border-t border-border bg-background">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !isLoading && handleSendMessage()}
                placeholder={isLoading ? "AI is thinking..." : "Ask me anything..."}
                disabled={isLoading}
                className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
              />
              <Button
                onClick={handleSendMessage}
                disabled={isLoading || !inputValue.trim()}
                className="bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 px-3"
                size="sm"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden lg:block h-full w-full">
        <div className="max-w-7xl mx-auto h-full px-4 py-4">
          <div className="grid grid-cols-4 gap-6 h-full">
            {/* Desktop Sidebar */}
            <div className="col-span-1 flex flex-col space-y-4 h-full">
              {/* New Chat */}
              <Button
                onClick={handleNewChat}
                className="w-full gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
                size="default"
              >
                <Plus className="w-4 h-4" />
                New Chat
              </Button>

              {/* Tutoring Modes */}
              <Card className="p-4 flex-shrink-0">
                <h3 className="font-semibold text-foreground mb-3 text-sm">Tutoring Modes</h3>
                <div className="space-y-2">
                  {tutorModes.map((mode) => (
                    <button
                      key={mode.id}
                      onClick={() => setSelectedMode(mode.id)}
                      className={`w-full text-left p-2.5 rounded-lg transition-colors text-sm ${selectedMode === mode.id
                        ? "bg-primary/10 text-primary border border-primary/30"
                        : "text-foreground hover:bg-muted border border-border"
                        }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <mode.icon className="w-4 h-4 flex-shrink-0" />
                        <span className="font-medium">{mode.name}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{mode.description}</p>
                    </button>
                  ))}
                </div>
              </Card>

              {/* Recent Chats */}
              <Card className="p-4 flex-1 flex flex-col min-h-0">
                <h3 className="font-semibold text-foreground mb-3 text-sm">Recent Conversations</h3>
                <div className="flex-1 overflow-y-auto space-y-2">
                  {recentChats.length > 0 ? (
                    recentChats.map((chat, idx) => (
                      <button
                        key={`chat-${idx}`}
                        onClick={() => {
                          try {
                            if (chat && chat.messages && Array.isArray(chat.messages)) {
                              const validMessages = chat.messages.filter(msg =>
                                msg &&
                                typeof msg.id !== 'undefined' &&
                                msg.role &&
                                msg.content &&
                                msg.timestamp
                              ).map(msg => ({
                                ...msg,
                                timestamp: msg.timestamp instanceof Date ? msg.timestamp : new Date(msg.timestamp)
                              }));

                              if (validMessages.length > 0) {
                                loadChat(validMessages);
                              }
                            }
                          } catch (error) {
                            console.error('Error loading chat:', error);
                          }
                        }}
                        className="w-full text-left p-2.5 hover:bg-muted rounded-lg transition-colors"
                      >
                        <p className="text-sm font-medium text-foreground truncate">{chat?.title || 'Untitled Chat'}</p>
                        <p className="text-xs text-muted-foreground">{chat?.date || 'Unknown date'}</p>
                      </button>
                    ))
                  ) : (
                    <p className="text-xs text-muted-foreground text-center py-4">No recent conversations</p>
                  )}
                </div>
              </Card>
            </div>

            {/* Desktop Chat Area */}
            <div className="col-span-3 flex flex-col min-h-0">
              <Card className="flex-1 p-4 flex flex-col bg-gradient-to-b from-background to-muted/20 min-h-0">
                {/* Header */}
                <div className="mb-4 pb-3 border-b border-border flex-shrink-0">
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-foreground">
                      {tutorModes.find((m) => m.id === selectedMode)?.name || "AI Tutor"}
                    </h2>
                    <Badge variant={isOnline ? "secondary" : "outline"} className="text-xs">
                      {isOnline ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground text-xs mt-1">
                    {tutorModes.find((m) => m.id === selectedMode)?.description}
                    {!isOnline && " (Cached responses)"}
                  </p>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto space-y-3 mb-4 min-h-0 px-1">
                  {messages.map((message) => (
                    <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[80%] px-3 py-2.5 rounded-lg ${message.role === "user"
                          ? "bg-primary text-primary-foreground rounded-br-sm"
                          : "bg-muted text-foreground rounded-bl-sm"
                          }`}
                      >
                        <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">{message.content}</p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <p className={`text-xs ${message.role === "user" ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                            {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </p>
                          {message.cached && (
                            <Badge variant="secondary" className="text-xs py-0 px-1">
                              <Clock className="h-2 w-2 mr-1" />
                              Cached
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="border-t border-border pt-3 flex-shrink-0">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && !isLoading && handleSendMessage()}
                      placeholder={isLoading ? "AI is thinking..." : "Ask me anything..."}
                      disabled={isLoading}
                      className="flex-1 bg-background border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={isLoading || !inputValue.trim()}
                      className="bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 px-3"
                      size="default"
                    >
                      {isLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2 px-1">
                    AI Tutor is here to help! Ask questions about any topic from your courses.
                  </p>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const tutorModes = [
  {
    id: "general",
    name: "General Q&A",
    description: "Ask any question and get detailed explanations",
    icon: HelpCircle,
  },
  {
    id: "concept",
    name: "Concept Deep Dive",
    description: "Understand complex topics step by step",
    icon: BookOpen,
  },
  {
    id: "practice",
    name: "Practice Problems",
    description: "Solve problems with guided help",
    icon: Lightbulb,
  },
  {
    id: "debate",
    name: "Debate Mode",
    description: "Discuss multiple perspectives on topics",
    icon: MessageCircle,
  },
]

function getInitialMessages(mode: string): Message[] {
  const baseMessage = {
    id: 1,
    role: "assistant" as const,
    timestamp: new Date(Date.now() - 5 * 60000),
  }

  const secondMessage = {
    id: 2,
    role: "assistant" as const,
    timestamp: new Date(Date.now() - 4 * 60000),
  }

  switch (mode) {
    case 'general':
      return [
        {
          ...baseMessage,
          content: "Hello! I'm your AI Tutor in General Q&A mode. I'm here to answer any questions you have with detailed, easy-to-understand explanations. Whether it's programming, science, math, or any other topic - just ask!"
        },
        {
          ...secondMessage,
          content: "I'll break down complex topics into simpler parts and use examples to help you understand. What would you like to learn about today?"
        }
      ]

    case 'concept':
      return [
        {
          ...baseMessage,
          content: "Welcome to Concept Deep Dive mode! I'm here to help you build deep understanding of any topic through comprehensive, step-by-step explanations."
        },
        {
          ...secondMessage,
          content: "I'll start with fundamentals and gradually introduce more complex aspects, using analogies and real-world examples. What concept would you like to explore in depth?"
        }
      ]

    case 'practice':
      return [
        {
          ...baseMessage,
          content: "Hi! I'm your AI Tutor in Practice Problems mode. I'm here to guide you through problem-solving by helping you think through the process step by step."
        },
        {
          ...secondMessage,
          content: "Instead of giving direct answers, I'll ask leading questions and provide hints to help you discover solutions yourself. What problem would you like to work on?"
        }
      ]

    case 'debate':
      return [
        {
          ...baseMessage,
          content: "Welcome to Debate Mode! I'm here to help you explore multiple perspectives on topics and develop critical thinking skills."
        },
        {
          ...secondMessage,
          content: "I'll present different viewpoints, challenge assumptions constructively, and help you analyze arguments. What topic would you like to discuss and explore from different angles?"
        }
      ]

    default:
      return [
        {
          ...baseMessage,
          content: "Hello! I'm your AI Tutor powered by advanced AI technology. I'm here to help you understand any concept, solve problems, and deepen your knowledge."
        },
        {
          ...secondMessage,
          content: "I can adapt my teaching style based on the mode you select. What would you like to learn about today?"
        }
      ]
  }
}




