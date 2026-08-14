import ReactMarkdown from "react-markdown";

import {
  Activity,
  ArrowRight,
  ArrowUp,
  BarChart3,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Database,
  Files,
  FileText,
  GitCompare,
  LayoutDashboard,
  MessageSquare,
  Plus,
  Search,
  Settings,
  Sparkles,
  Trash2,
  Upload,
} from "lucide-react";

import { useEffect, useRef, useState } from "react";

import {
  getDocuments,
  uploadDocument,
  askQuestion,
  deleteDocument,
} from "./api";

import "./App.css";


function App() {

  const [activePage, setActivePage] = useState("Overview");

  const [documents, setDocuments] = useState([]);

  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([]);

  const [asking, setAsking] = useState(false);
  const [chatError, setChatError] = useState("");

  const fileInputRef = useRef(null);


  // =========================================================
  // GREETING
  // =========================================================

  const currentHour = new Date().getHours();

  let greeting;

  if (currentHour < 12) {
    greeting = "Good Morning";
  } else if (currentHour < 18) {
    greeting = "Good Afternoon";
  } else {
    greeting = "Good Evening";
  }


  // =========================================================
  // LOAD DOCUMENTS
  // =========================================================

  useEffect(() => {
    loadDocuments();
  }, []);


  async function loadDocuments() {

    try {

      const data = await getDocuments();

      setDocuments(data.documents || []);

    } catch (error) {

      console.error(
        "Failed to load documents:",
        error
      );

    }

  }


  // =========================================================
  // UPLOAD DOCUMENT
  // =========================================================

  async function handleUpload(event) {

    const file = event.target.files[0];

    if (!file) {
      return;
    }


    if (file.type !== "application/pdf") {

      setUploadError(
        "Only PDF files are supported."
      );

      return;
    }


    setUploading(true);
    setUploadError("");


    try {

      await uploadDocument(file);

      await loadDocuments();

    } catch (error) {

      console.error(error);

      setUploadError(
        error.message ||
        "Failed to upload document."
      );

    } finally {

      setUploading(false);

      event.target.value = "";

    }

  }


  // =========================================================
  // ASK AI QUESTION
  // =========================================================

  async function handleAskQuestion() {

    const trimmedQuestion =
      question.trim();


    if (!trimmedQuestion || asking) {
      return;
    }


    // Add user message to conversation immediately
    setMessages((prev) => [
      ...prev,
      {
        role: "user",
        content: trimmedQuestion,
      },
    ]);

    // Clear input right away so it's not editable
    setQuestion("");

    setAsking(true);
    setChatError("");


    try {

      const data =
        await askQuestion(
          trimmedQuestion
        );


      // Add AI response to conversation
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            data.answer ||
            "No answer was returned.",
          sources:
            data.sources || [],
        },
      ]);


    } catch (error) {

      console.error(error);

      setChatError(
        error.message ||
        "Failed to get an answer."
      );

    } finally {

      setAsking(false);

    }

  }


  // =========================================================
  // DELETE DOCUMENT
  // =========================================================

  async function handleDeleteDocument(
    documentId
  ) {

    const confirmed =
      window.confirm(
        "Are you sure you want to delete this document?"
      );


    if (!confirmed) {
      return;
    }


    try {

      await deleteDocument(
        documentId
      );


      await loadDocuments();


      // Clear old conversation
      setMessages([]);
      setChatError("");


    } catch (error) {

      console.error(error);

      setUploadError(
        error.message ||
        "Failed to delete document."
      );

    }

  }


  // =========================================================
  // NAVIGATION
  // =========================================================

  const navigation = [

    {
      section: "WORKSPACE",

      items: [

        {
          name: "Overview",
          icon: LayoutDashboard,
        },

        {
          name: "Knowledge",
          icon: Files,
        },

        {
          name: "AI Chat",
          icon: MessageSquare,
        },

        {
          name: "Insights",
          icon: Sparkles,
        },

        {
          name: "Compare",
          icon: GitCompare,
        },

      ],
    },


    {
      section: "SYSTEM",

      items: [

        {
          name: "Settings",
          icon: Settings,
        },

      ],
    },

  ];


  // =========================================================
  // CHANGE PAGE
  // =========================================================

  function handlePageChange(page) {

    setActivePage(page);

    // Clear temporary chat errors when leaving AI Chat
    if (page !== "AI Chat") {
      setChatError("");
    }

  }


  // =========================================================
  // UI
  // =========================================================

  return (

    <div className="app-shell">


      {/* =====================================================
          SIDEBAR
      ===================================================== */}

      <aside className="sidebar">


        {/* BRAND */}

        <div className="brand">

          <div className="brand-mark">

            <Sparkles size={17} />

          </div>


          <div>

            <div className="brand-name">
              Nexus
            </div>

            <div className="brand-subtitle">
              AI Knowledge
            </div>

          </div>

        </div>


        {/* NEW SPACE */}

        <button className="new-space-btn">

          <Plus size={16} />

          New Space

        </button>


        {/* NAVIGATION */}

        <div className="navigation">

          {navigation.map((group) => (

            <div
              className="nav-group"
              key={group.section}
            >

              <div className="nav-label">
                {group.section}
              </div>


              {group.items.map((item) => {

                const Icon =
                  item.icon;


                return (

                  <button
                    key={item.name}

                    className={`nav-item ${
                      activePage === item.name
                        ? "active"
                        : ""
                    }`}

                    onClick={() =>
                      handlePageChange(
                        item.name
                      )
                    }

                  >

                    <Icon size={17} />

                    <span>
                      {item.name}
                    </span>

                  </button>

                );

              })}

            </div>

          ))}

        </div>


        {/* SIDEBAR BOTTOM */}

        <div className="sidebar-bottom">


          {/* STORAGE */}

          <div className="storage-card">

            <div className="storage-header">

              <span>
                Storage
              </span>

              <Database size={14} />

            </div>


            <div className="storage-value">

              {documents.length} documents

            </div>


            <div className="storage-bar">

              <div className="storage-progress"></div>

            </div>


            <div className="storage-meta">

              Knowledge base

            </div>

          </div>


          {/* PROFILE */}

          <div className="profile">

            <div className="avatar">
              SP
            </div>


            <div className="profile-info">

              <div className="profile-name">
                Shiva Prasad
              </div>

              <div className="profile-role">
                Personal Workspace
              </div>

            </div>

          </div>

        </div>

      </aside>


      {/* =====================================================
          MAIN
      ===================================================== */}

      <main className="main-content">


        {/* TOPBAR */}

        <header className="topbar">


          <div className="breadcrumb">

            Workspace

            <ChevronRight size={14} />

            <strong>
              {activePage}
            </strong>

          </div>


          <div className="topbar-actions">


            <button className="search-button">

              <Search size={16} />

              <span>
                Search knowledge
              </span>

              <kbd>
                Ctrl K
              </kbd>

            </button>


            <button className="icon-button">

              <Activity size={18} />

            </button>


            <div className="top-avatar">
              SP
            </div>


          </div>

        </header>


        {/* ===================================================
            PAGE CONTENT
        =================================================== */}

        <section className="page">


          {/* =================================================
              AI CHAT
          ================================================= */}

          {activePage === "AI Chat" && (

            <AIChatPage

              question={question}

              setQuestion={setQuestion}

              messages={messages}

              asking={asking}

              chatError={chatError}

              handleAskQuestion={
                handleAskQuestion
              }

              handleUpload={
                handleUpload
              }

              fileInputRef={
                fileInputRef
              }

              uploading={uploading}

            />

          )}


          {/* =================================================
              OVERVIEW
          ================================================= */}

          {activePage === "Overview" && (

            <OverviewPage

              greeting={greeting}

              documents={documents}

              uploading={uploading}

              uploadError={uploadError}

              question={question}

              setQuestion={setQuestion}

              messages={messages}

              asking={asking}

              chatError={chatError}

              handleUpload={
                handleUpload
              }

              handleAskQuestion={
                handleAskQuestion
              }

              handleDeleteDocument={
                handleDeleteDocument
              }

              setActivePage={
                setActivePage
              }

            />

          )}


          {/* =================================================
              KNOWLEDGE
          ================================================= */}

          {activePage === "Knowledge" && (

            <KnowledgePage

              documents={documents}

              uploading={uploading}

              uploadError={uploadError}

              handleUpload={
                handleUpload
              }

              handleDeleteDocument={
                handleDeleteDocument
              }

            />

          )}


          {/* =================================================
              OTHER PAGES
          ================================================= */}

          {(
            activePage === "Insights" ||
            activePage === "Compare" ||
            activePage === "Settings"
          ) && (

            <ComingSoonPage
              page={activePage}
            />

          )}

        </section>

      </main>

    </div>

  );

}


/* =========================================================
   OVERVIEW PAGE
========================================================= */

function OverviewPage({

  greeting,
  documents,
  uploading,
  uploadError,

  question,
  setQuestion,

  messages,
  asking,
  chatError,

  handleUpload,
  handleAskQuestion,
  handleDeleteDocument,

  setActivePage,

}) {

  // Show the last user question + answer inline (if any)
  const lastUserMessage =
    [...messages]
      .reverse()
      .find((m) => m.role === "user");

  const lastAssistantMessage =
    [...messages]
      .reverse()
      .find((m) => m.role === "assistant");


  return (

    <>


      {/* PAGE HEADER */}

      <div className="page-heading">

        <div>

          <div className="eyebrow">
            PERSONAL KNOWLEDGE OS
          </div>


          <h1>
            {greeting}, Shiva.
          </h1>


          <p>
            Your knowledge is indexed and ready to explore.
          </p>

        </div>


        <label className="upload-button">

          <Upload size={16} />

          {uploading
            ? "Processing..."
            : "Upload documents"
          }


          <input

            type="file"

            accept=".pdf,application/pdf"

            onChange={handleUpload}

            hidden

            disabled={uploading}

          />

        </label>

      </div>


      {/* AI SEARCH */}

      <div className="hero-card">


        <div className="hero-glow"></div>


        <div className="hero-content">


          <div className="ai-icon">

            <Sparkles size={19} />

          </div>


          <div>

            <div className="hero-title">
              Ask your knowledge
            </div>

            <div className="hero-description">
              Search across your documents using natural language.
            </div>

          </div>

        </div>


        <div className="chat-input">


          <textarea

            value={question}

            onChange={(event) =>
              setQuestion(
                event.target.value
              )
            }

            onKeyDown={(event) => {

              if (
                event.key === "Enter" &&
                !event.shiftKey
              ) {

                event.preventDefault();

                handleAskQuestion();

              }

            }}

            placeholder="What would you like to know?"

            disabled={asking}

            rows={2}

          />


          <button

            onClick={
              handleAskQuestion
            }

            disabled={
              asking ||
              !question.trim()
            }

          >

            <ArrowUp size={17} />

          </button>

        </div>


        {asking && (

          <div className="chat-response">

            <div className="response-label">

              <Sparkles size={14} />

              Thinking...

            </div>

          </div>

        )}


        {chatError && (

          <div className="chat-error">

            {chatError}

          </div>

        )}


        {lastUserMessage &&
          lastAssistantMessage &&
          !asking && (

          <div className="chat-response">


            <div className="response-question">

              <strong>Q:</strong>{" "}
              {lastUserMessage.content}

            </div>


            <div className="response-answer">

              <ReactMarkdown>
                {lastAssistantMessage.content}
              </ReactMarkdown>

            </div>

          </div>

        )}


        {/* SUGGESTIONS */}

        <div className="suggestions">


          <button

            onClick={() =>
              setQuestion(
                "Summarize my resume"
              )
            }

          >

            <Sparkles size={14} />

            Summarize my resume

          </button>


          <button

            onClick={() =>
              setQuestion(
                "What are my technical skills?"
              )
            }

          >

            <FileText size={14} />

            Find my technical skills

          </button>


          <button

            onClick={() =>
              setQuestion(
                "What projects are mentioned in my documents?"
              )
            }

          >

            <GitCompare size={14} />

            Find my projects

          </button>


        </div>

      </div>


      {/* STATS */}

      <div className="stats-grid">


        <StatCard

          icon={<Files size={18} />}

          label="Documents"

          value={documents.length}

          change="Indexed documents"

        />


        <StatCard

          icon={<Database size={18} />}

          label="Indexed chunks"

          value="Live"

          change="Vector search ready"

        />


        <StatCard

          icon={<MessageSquare size={18} />}

          label="Questions"

          value={messages.filter((m) => m.role === "user").length}

          change="Asked this session"

        />


        <StatCard

          icon={<Sparkles size={18} />}

          label="Knowledge"

          value="RAG"

          change="Retrieval augmented"

        />

      </div>


      {/* LOWER SECTION */}

      <div className="content-grid">


        {/* DOCUMENTS */}

        <div className="panel">


          <div className="panel-header">


            <div>

              <h2>
                Recent knowledge
              </h2>

              <p>
                Your latest indexed documents
              </p>

            </div>


            <button

              className="text-button"

              onClick={() =>
                setActivePage(
                  "Knowledge"
                )
              }

            >

              View all

              <ChevronRight size={15} />

            </button>

          </div>


          {documents.length === 0 ? (

            <div className="empty-state">

              <FileText size={22} />

              <div>

                <strong>
                  No documents yet
                </strong>

                <p>
                  Upload a PDF to build your knowledge base.
                </p>

              </div>

            </div>

          ) : (

            documents.map(
              (document) => (

                <DocumentRow

                  key={
                    document.document_id
                  }

                  name={
                    document.filename
                  }

                  meta={
                    `${document.pages} pages · ${document.chunks} chunks`
                  }

                  onDelete={() =>
                    handleDeleteDocument(
                      document.document_id
                    )
                  }

                />

              )
            )

          )}


          {uploadError && (

            <div className="upload-error">

              {uploadError}

            </div>

          )}

        </div>


        {/* ACTIVITY */}

        <div className="panel">


          <div className="panel-header">

            <div>

              <h2>
                AI activity
              </h2>

              <p>
                Recent knowledge interactions
              </p>

            </div>

          </div>


          <ActivityRow

            text="AI assistant ready"

            detail="RAG pipeline"

            time="Now"

          />


          <ActivityRow

            text="Document indexing"

            detail="FAISS vector store"

            time="Ready"

          />


          <ActivityRow

            text="Answer generation"

            detail="Gemini LLM"

            time="Ready"

          />

        </div>

      </div>

    </>

  );

}


/* =========================================================
   AI CHAT PAGE
========================================================= */

function AIChatPage({

  question,
  setQuestion,

  messages,
  asking,
  chatError,

  handleAskQuestion,
  handleUpload,

  fileInputRef,
  uploading,

}) {

  const scrollRef = useRef(null);


  // Auto-scroll to bottom on new messages
  useEffect(() => {

    if (scrollRef.current) {

      scrollRef.current.scrollTop =
        scrollRef.current.scrollHeight;

    }

  }, [messages, asking]);


  return (

    <div className="ai-chat-page">


      <div className="chat-page-header">

        <div>

          <div className="eyebrow">
            AI KNOWLEDGE ASSISTANT
          </div>

          <h1>
            AI Chat
          </h1>

          <p>
            Ask questions and get answers from your uploaded documents.
          </p>

        </div>

      </div>


      <div className="chat-main-card">


        <div className="chat-main-header">


          <div className="ai-icon">

            <Sparkles size={19} />

          </div>


          <div>

            <div className="hero-title">
              Ask your knowledge
            </div>

            <div className="hero-description">
              Search across your documents using natural language.
            </div>

          </div>

        </div>


        {/* =================================================
            MESSENGER-STYLE CONVERSATION
        ================================================= */}

        <div
          className="chat-messages"
          ref={scrollRef}
        >

          {messages.length === 0 ? (

            <div className="chat-empty">


              <Sparkles size={30} />


              <h3>
                Ask anything about your documents
              </h3>


              <p>
                Your questions are answered using the information indexed in your knowledge base.
              </p>


              <div className="chat-suggestions">


                <button

                  onClick={() =>
                    setQuestion(
                      "Summarize my resume"
                    )
                  }

                >
                  Summarize my resume
                </button>


                <button

                  onClick={() =>
                    setQuestion(
                      "What are my technical skills?"
                    )
                  }

                >
                  Find my technical skills
                </button>


                <button

                  onClick={() =>
                    setQuestion(
                      "What projects are mentioned in my documents?"
                    )
                  }

                >
                  Find my projects
                </button>


              </div>

            </div>

          ) : (

            <>

              {messages.map(
                (message, index) => (
                  <MessageBubble
                    key={index}
                    message={message}
                  />
                )
              )}


              {asking && (

                <div className="message-row assistant">

                  <div className="message-avatar">
                    <Sparkles size={13} />
                  </div>

                  <div className="message-bubble typing">

                    <span></span>
                    <span></span>
                    <span></span>

                  </div>

                </div>

              )}

            </>

          )}

        </div>


        {/* =================================================
            CHAT INPUT BAR
        ================================================= */}

        <div className="chat-large-input">


          {/* ATTACH FILES (+) BUTTON */}

          <label className="chat-attach-button">

            <Plus size={18} />

            <input

              type="file"

              accept=".pdf,application/pdf"

              onChange={handleUpload}

              hidden

              disabled={uploading}

            />

          </label>


          <input

            type="text"

            value={question}

            onChange={(event) =>
              setQuestion(
                event.target.value
              )
            }

            onKeyDown={(event) => {

              if (
                event.key === "Enter"
              ) {

                event.preventDefault();

                handleAskQuestion();

              }

            }}

            placeholder="Ask a question about your documents..."

            disabled={asking}

          />


          <button

            onClick={
              handleAskQuestion
            }

            disabled={
              asking ||
              !question.trim()
            }

          >

            <ArrowUp size={18} />

          </button>

        </div>


        {uploading && (

          <div className="chat-upload-status">

            <FileText size={14} />

            Uploading and indexing your document...

          </div>

        )}


        {chatError && (

          <div className="chat-error">

            {chatError}

          </div>

        )}

      </div>

    </div>

  );

}


/* =========================================================
   MESSAGE BUBBLE
========================================================= */

function MessageBubble({
  message,
}) {


  if (message.role === "user") {

    return (

      <div className="message-row user">

        <div className="message-bubble user-bubble">

          {message.content}

        </div>

      </div>

    );

  }


  return (

    <div className="message-row assistant">

      <div className="message-avatar">

        <Sparkles size={13} />

      </div>


      <div className="message-bubble assistant-bubble">

        <div className="response-answer">

          <ReactMarkdown>
            {message.content}
          </ReactMarkdown>

        </div>

      </div>

    </div>

  );

}


/* =========================================================
   STAT CARD
========================================================= */

function StatCard({

  icon,
  label,
  value,
  change,

}) {


  return (

    <div className="stat-card">


      <div className="stat-icon">

        {icon}

      </div>


      <div className="stat-label">

        {label}

      </div>


      <div className="stat-value">

        {value}

      </div>


      <div className="stat-change">

        {change}

      </div>

    </div>

  );

}


/* =========================================================
   DOCUMENT ROW
========================================================= */

function DocumentRow({

  name,
  meta,
  onDelete,

}) {


  return (

    <div className="document-row">


      <div className="document-icon">

        <FileText size={18} />

      </div>


      <div className="document-info">

        <div className="document-name">

          {name}

        </div>


        <div className="document-meta">

          {meta}

        </div>

      </div>


      <div className="status-dot"></div>


      <button

        className="delete-document-button"

        onClick={onDelete}

      >

        Delete

      </button>

    </div>

  );

}


/* =========================================================
   ACTIVITY ROW
========================================================= */

function ActivityRow({

  text,
  detail,
  time,

}) {


  return (

    <div className="activity-row">


      <div className="activity-dot"></div>


      <div className="activity-info">

        <div>
          {text}
        </div>


        <span>
          {detail}
        </span>

      </div>


      <time>
        {time}
      </time>

    </div>

  );

}


/* =========================================================
   EXPORT
========================================================= */

export default App;