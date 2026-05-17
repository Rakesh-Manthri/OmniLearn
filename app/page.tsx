'use client';

import React, { useState, useEffect } from 'react';
import styles from './page.module.css';
import { 
  BookOpen, 
  BrainCircuit, 
  Timer, 
  LayoutDashboard, 
  MessageSquare, 
  Settings, 
  Search,
  Sparkles,
  Play,
  Send,
  Zap,
  UploadCloud,
  Headphones,
  Coffee,
  Volume2,
  Sun,
  Moon,
  Lock,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isLightMode, setIsLightMode] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  useEffect(() => {
    if (isLightMode) {
      document.documentElement.classList.add('light-theme');
    } else {
      document.documentElement.classList.remove('light-theme');
    }
  }, [isLightMode]);

  const toggleTheme = () => setIsLightMode(!isLightMode);

  if (!isAuthenticated) {
    return (
      <div className={styles.landingContainer}>
        <div className={styles.blob1}></div>
        <div className={styles.blob2}></div>
        
        <header className={styles.landingHeader}>
          <div className={styles.logo}>
            <div className={styles.logoIcon}>
              <Sparkles size={18} />
            </div>
            Gemma
          </div>
          <button className={styles.themeToggle} onClick={toggleTheme} aria-label="Toggle theme">
            {isLightMode ? <Moon size={20} /> : <Sun size={20} />}
          </button>
        </header>

        {/* Hero Section */}
        <section className={styles.heroSection}>
          <h1 className={styles.landingTitle}>
            Master Complex Topics,<br/>
            <span className="gradient-text" style={{ background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-tertiary))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Without the Friction
            </span>
          </h1>
          
          <button className={styles.triggerLoginBtn} onClick={() => setShowLoginModal(true)}>
            <Lock size={18} /> Login to Workspace
          </button>

          <div className={styles.scrollIndicator}>
            <span>Scroll to discover</span>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14M19 12l-7 7-7-7"/>
            </svg>
          </div>
        </section>

        {/* Description Section */}
        <section className={styles.descSection}>
          <h2 style={{ fontSize: '2.5rem', marginBottom: '2rem', fontFamily: 'var(--font-heading)' }}>The Paradox of Choice</h2>
          <p className={styles.landingDesc}>
            Self-directed online learning promises infinite knowledge but delivers zero structure. Students today face a massive "paradox of choice". Gemma Study Sphere eliminates cognitive friction by unifying your AI idea generation, focus timers, study roadmaps, and resources into one cohesive flow state.
          </p>
        </section>

        {/* Login Modal Overlay */}
        {showLoginModal && (
          <div className={styles.modalOverlay} onClick={() => setShowLoginModal(false)}>
            <div className={styles.loginCard} onClick={(e) => e.stopPropagation()}>
              <button className={styles.closeModalBtn} onClick={() => setShowLoginModal(false)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
              
              <h2 style={{ fontSize: '1.75rem', marginBottom: '2rem', fontFamily: 'var(--font-heading)', textAlign: 'center' }}>Welcome Back</h2>
              
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Email</label>
                <input type="email" className={styles.inputField} placeholder="alex@example.com" />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Password</label>
                <input type="password" className={styles.inputField} placeholder="••••••••" />
              </div>
              <button className={styles.loginBtn} onClick={() => setIsAuthenticated(true)}>
                Authenticate
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Sidebar Navigation */}
      <aside className={`${styles.sidebar} ${isSidebarCollapsed ? styles.collapsed : ''}`}>
        <button 
          className={styles.sidebarToggleBtn} 
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        >
          {isSidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>

        <div className={styles.logo}>
          <div className={styles.logoIcon}>
            <Sparkles size={18} />
          </div>
          <span className={styles.logoText}>Gemma</span>
        </div>
        
        <nav className={styles.nav}>
          <a href="#" className={`${styles.navItem} ${activeTab === 'dashboard' ? styles.navItemActive : ''}`} onClick={(e) => { e.preventDefault(); setActiveTab('dashboard'); }}>
            <LayoutDashboard size={20} style={{ minWidth: 20 }} />
            <span className={styles.navText}>Dashboard</span>
          </a>
          <a href="#" className={`${styles.navItem} ${activeTab === 'course' ? styles.navItemActive : ''}`} onClick={(e) => { e.preventDefault(); setActiveTab('course'); }}>
            <BrainCircuit size={20} style={{ minWidth: 20 }} />
            <span className={styles.navText}>Course Gen</span>
          </a>
          <a href="#" className={`${styles.navItem} ${activeTab === 'focus' ? styles.navItemActive : ''}`} onClick={(e) => { e.preventDefault(); setActiveTab('focus'); }}>
            <Timer size={20} style={{ minWidth: 20 }} />
            <span className={styles.navText}>Focus Room</span>
          </a>
          <a href="#" className={`${styles.navItem} ${activeTab === 'guider' ? styles.navItemActive : ''}`} onClick={(e) => { e.preventDefault(); setActiveTab('guider'); }}>
            <MessageSquare size={20} style={{ minWidth: 20 }} />
            <span className={styles.navText}>AI Guider</span>
          </a>
        </nav>
        
        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <button className={styles.navItem} onClick={toggleTheme} style={{ width: '100%', textAlign: 'left', background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
            {isLightMode ? <Moon size={20} style={{ minWidth: 20 }} /> : <Sun size={20} style={{ minWidth: 20 }} />}
            <span className={styles.navText}>{isLightMode ? 'Dark Mode' : 'Light Mode'}</span>
          </button>
          <a href="#" className={styles.navItem}>
            <Settings size={20} style={{ minWidth: 20 }} />
            <span className={styles.navText}>Settings</span>
          </a>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className={styles.main}>
        {/* Top Header */}
        <header className={styles.header}>
          <div className={styles.greeting}>
            <h1>Good evening, Alex</h1>
            <p>
              {activeTab === 'dashboard' && "Ready to continue your journey in Quantum Computing?"}
              {activeTab === 'course' && "Let's structure your infinite knowledge."}
              {activeTab === 'focus' && "Eliminate distractions. Enter the flow state."}
              {activeTab === 'guider' && "Your personal coach is ready to assist."}
            </p>
          </div>
          
          <div className={styles.profile} onClick={() => setIsAuthenticated(false)}>
            <div className={styles.avatar}></div>
            <span className={styles.profileName}>Alex M.</span>
          </div>
        </header>

        {/* Dynamic Views */}
        {activeTab === 'dashboard' && <DashboardView setActiveTab={setActiveTab} />}
        {activeTab === 'course' && <CourseGenView />}
        {activeTab === 'focus' && <FocusRoomView />}
        {activeTab === 'guider' && <GuiderView />}

      </main>
    </div>
  );
}

function DashboardView({ setActiveTab }: { setActiveTab: (tab: string) => void }) {
  return (
    <div className={styles.grid}>
      {/* Left Column */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
        
        {/* Active Focus Session Hero */}
        <div className={styles.heroCard}>
          <div className={styles.heroGlow}></div>
          <div className={styles.heroContent}>
            <span className={styles.heroTag}>Currently Focusing</span>
            <h2 className={styles.heroTitle}>Quantum Superposition</h2>
            <p className={styles.heroDesc}>
              You're 45 minutes into your deep dive. You've mastered Qubits, now it's time to understand how particles exist in multiple states.
            </p>
            <div className={styles.heroActions}>
              <button className={styles.btnPrimary} onClick={() => setActiveTab('focus')}>
                <Play size={18} fill="currentColor" /> Resume Session
              </button>
              <button className={styles.btnSecondary} onClick={() => setActiveTab('course')}>
                <BookOpen size={18} /> View Roadmap
              </button>
            </div>
          </div>
        </div>

        {/* Tool Integration Grid */}
        <div>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '1.25rem' }}>Your Toolkit</h3>
          <div className={styles.toolsGrid}>
            <div className={styles.toolCard} onClick={() => setActiveTab('course')}>
              <div className={styles.toolIcon}>
                <BrainCircuit size={24} />
              </div>
              <h4 className={styles.toolTitle}>Course Generator</h4>
              <p className={styles.toolDesc}>Turn any PDF or YouTube video into a structured study path instantly.</p>
            </div>
            
            <div className={styles.toolCard} onClick={() => setActiveTab('focus')}>
              <div className={styles.toolIcon}>
                <Timer size={24} />
              </div>
              <h4 className={styles.toolTitle}>Focus Room</h4>
              <p className={styles.toolDesc}>Immersive Pomodoro environment with ambient noise and site blockers.</p>
            </div>
            
            <div className={styles.toolCard} onClick={() => setActiveTab('guider')}>
              <div className={styles.toolIcon}>
                <Search size={24} />
              </div>
              <h4 className={styles.toolTitle}>Deep Search</h4>
              <p className={styles.toolDesc}>Search across all your generated materials, notes, and transcripts.</p>
            </div>
          </div>
        </div>
        
      </div>

      {/* Right Column: AI Guider Panel */}
      <div className={styles.sidePanel}>
        <div className={styles.widget} style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div className={styles.widgetHeader}>
            <h3 className={styles.widgetTitle}>
              <Zap size={20} className={styles.widgetTitleIcon} />
              Gemma Coach
            </h3>
          </div>
          
          <div className={styles.aiChat} style={{ flex: 1 }}>
            <div className={styles.aiMessage}>
              I noticed you struggled with the concept of entanglement yesterday. Would you like me to find a simpler visual explanation before we move to Superposition?
            </div>
          </div>
          
          <div className={styles.aiInput}>
            <input 
              type="text" 
              className={styles.inputField} 
              placeholder="Ask a question or request a resource..." 
            />
            <button className={styles.sendBtn}>
              <Send size={18} />
            </button>
          </div>
        </div>

        {/* Quick Progress Widget */}
        <div className={styles.widget}>
          <h3 className={styles.widgetTitle} style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>Weekly Goal</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>12 hrs / 18 hrs focused</p>
          
          <div className={styles.progressSection}>
            <div className={styles.progressBar}>
              <div className={styles.progressFill}></div>
            </div>
            <div className={styles.progressStats}>
              <span>66%</span>
              <span>6 hrs left</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CourseGenView() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', animation: 'fadeIn 0.5s ease-out', maxWidth: '800px', margin: '0 auto', width: '100%' }}>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Generate Your Next Module</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>Paste a YouTube link, Wikipedia article, or upload a PDF to instantly create a structured roadmap.</p>
      </div>

      <div className={styles.widget} style={{ padding: '3rem', display: 'flex', flexDirection: 'column', alignItems: 'center', borderStyle: 'dashed', borderWidth: '2px', borderColor: 'var(--accent-primary)', background: 'rgba(99, 102, 241, 0.02)' }}>
        <UploadCloud size={48} color="var(--accent-primary)" style={{ marginBottom: '1.5rem' }} />
        <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Drag & Drop Materials</h3>
        <p style={{ color: 'var(--text-tertiary)', marginBottom: '2rem' }}>Supports .pdf, .docx, .txt, or direct URLs</p>
        
        <div style={{ display: 'flex', width: '100%', maxWidth: '500px', gap: '0.5rem' }}>
          <input type="text" className={styles.inputField} placeholder="https://youtube.com/watch?v=..." style={{ flex: 1 }} />
          <button className={styles.btnPrimary} style={{ padding: '0.75rem 1.5rem' }}>Generate</button>
        </div>
      </div>

      <div>
        <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Recent Generations</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {[
            { title: 'Quantum Computing for Beginners', source: 'YouTube (3hr playlist)', progress: '45%' },
            { title: 'Advanced Data Structures', source: 'MIT OpenCourseWare PDF', progress: '100%' }
          ].map((item, i) => (
            <div key={i} className={styles.widget} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem' }}>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'var(--glass-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <BrainCircuit size={20} color="var(--accent-secondary)" />
                </div>
                <div>
                  <h4 style={{ fontWeight: 600 }}>{item.title}</h4>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)' }}>{item.source}</span>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                <span style={{ fontWeight: 600, color: 'var(--accent-primary)' }}>{item.progress}</span>
                <button className={styles.btnSecondary} style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}>Continue</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function FocusRoomView() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, animation: 'fadeIn 0.5s ease-out' }}>
      
      <div style={{ background: 'radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, rgba(0,0,0,0) 70%)', padding: '5rem', borderRadius: '50%', display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, border: '1px solid rgba(99, 102, 241, 0.3)', borderRadius: '50%', animation: 'pulseGlow 4s infinite' }}></div>
        
        <span style={{ color: 'var(--text-secondary)', fontSize: '1.2rem', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '1rem' }}>Deep Work</span>
        <h1 style={{ fontSize: '8rem', fontWeight: 300, lineHeight: 1, fontFamily: 'var(--font-heading)', color: 'var(--text-primary)', marginBottom: '2rem' }}>25:00</h1>
        
        <div style={{ display: 'flex', gap: '1.5rem' }}>
          <button className={styles.btnSecondary} style={{ width: '64px', height: '64px', borderRadius: '50%', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Coffee size={24} />
          </button>
          <button className={styles.btnPrimary} style={{ width: '80px', height: '80px', borderRadius: '50%', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 30px rgba(99, 102, 241, 0.6)' }}>
            <Play size={32} fill="currentColor" style={{ marginLeft: '6px' }} />
          </button>
          <button className={styles.btnSecondary} style={{ width: '64px', height: '64px', borderRadius: '50%', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Headphones size={24} />
          </button>
        </div>
      </div>

      <div className={styles.widget} style={{ marginTop: '4rem', width: '100%', maxWidth: '600px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h4 style={{ fontWeight: 600, marginBottom: '0.25rem' }}>Ambient Sound</h4>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-tertiary)' }}>Binaural Beats - Gamma Waves</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <Volume2 size={20} color="var(--text-secondary)" />
          <div style={{ width: '100px', height: '6px', background: 'var(--bg-tertiary)', borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{ width: '70%', height: '100%', background: 'var(--accent-primary)' }}></div>
          </div>
        </div>
      </div>

    </div>
  );
}

function GuiderView() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', animation: 'fadeIn 0.5s ease-out' }}>
      <div className={styles.widget} style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--border-color)' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent-secondary), var(--accent-primary))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Zap size={24} color="white" />
          </div>
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Gemma Coach</h2>
            <p style={{ color: 'var(--text-secondary)' }}>Your personal AI tutor with long-term memory.</p>
          </div>
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1.5rem', overflowY: 'auto', paddingRight: '1rem' }}>
          <div style={{ alignSelf: 'flex-start', maxWidth: '80%' }}>
            <div className={styles.aiMessage} style={{ fontSize: '1rem', padding: '1.25rem' }}>
              Welcome back, Alex. I noticed we left off at Quantum Superposition. Are you ready to dive into the math, or would you prefer a conceptual overview first?
            </div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', marginLeft: '0.5rem', marginTop: '0.5rem', display: 'block' }}>10:42 AM</span>
          </div>

          <div style={{ alignSelf: 'flex-end', maxWidth: '80%' }}>
            <div style={{ background: 'var(--accent-primary)', color: 'white', padding: '1.25rem', borderRadius: '12px', borderTopRightRadius: '4px', fontSize: '1rem', lineHeight: 1.6 }}>
              Let's do a conceptual overview first, I'm a bit tired today.
            </div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', marginRight: '0.5rem', marginTop: '0.5rem', display: 'block', textAlign: 'right' }}>10:45 AM</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem', background: 'var(--bg-tertiary)', padding: '0.5rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <input 
            type="text" 
            style={{ flex: 1, background: 'transparent', border: 'none', padding: '1rem', color: 'var(--text-primary)', outline: 'none', fontSize: '1rem' }} 
            placeholder="Type your response..." 
          />
          <button className={styles.btnPrimary} style={{ padding: '0 1.5rem' }}>
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
