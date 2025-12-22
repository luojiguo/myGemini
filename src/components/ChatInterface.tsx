import React, { useState, useRef, useEffect } from 'react';
import { Send, User, Bot, Trash2, MessageSquare, Plus, Settings, LogOut, Moon, Sun, Paperclip, X, Image as ImageIcon, MessageCircle, Mail, Github } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { sendMessageToGemini, type ChatMessage } from '../services/gemini';
import {
    ConfigProvider,
    Layout,
    Input,
    Button,
    Avatar,
    Typography,
    Space,
    theme as antTheme,
    Spin,
    message as antMessage,
    Card,
    Tooltip,
    Popconfirm,
    Modal,
    Tabs,
    Select,
    Divider,
    Form,
    Image
} from 'antd';
import { UserOutlined } from '@ant-design/icons';

const { Header, Content, Sider } = Layout;
const { Text, Title } = Typography;
const { TextArea } = Input;

// --- Types ---
interface ChatSession {
    id: string;
    title: string;
    messages: ChatMessage[];
    timestamp: number;
}

type Language = 'en' | 'zh';
type ThemeMode = 'dark' | 'light';

interface Attachment {
    id: string;
    file: File;
    preview: string;
    base64: string;
    mimeType: string;
}

// --- Translations ---
const translations = {
    en: {
        title: 'Gemini Chat',
        newChat: 'New chat',
        recent: 'Today',
        deleteConfirm: 'Delete chat?',
        deleteDesc: 'This will permanently delete this conversation.',
        delete: 'Delete',
        cancel: 'Cancel',
        online: 'Online',
        welcome: 'Gemini',
        subtitle: 'How can I help you today?',
        thinking: 'Thinking...',
        placeholder: 'Message Gemini...',
        error: 'Error encountered connecting to AI service.',
        clearSuccess: 'History cleared',
        user: 'User',
        settings: 'Settings',
        theme: 'Theme',
        language: 'Language',
        darkMode: 'Dark Mode',
        lightMode: 'Light Mode',
        clearAll: 'Clear all chats',
        clearAllConfirm: 'Are you sure you want to delete ALL chat history?',
        feedback: 'Send Feedback',
        contact: 'Contact Us',
        logout: 'Log out',
        about: 'About',
        general: 'General',
        send: 'Send',
        feedbackPlaceholder: 'Tell us what you think...',
        feedbackSuccess: 'Thank you for your feedback!',
        attach: 'Attach image'
    },
    zh: {
        title: 'Gemini 对话',
        newChat: '新对话',
        recent: '近期',
        deleteConfirm: '删除对话？',
        deleteDesc: '这将永久删除此对话。',
        delete: '删除',
        cancel: '取消',
        online: '在线',
        welcome: 'Gemini',
        subtitle: '今天我能为您做什么？',
        thinking: '思考中...',
        placeholder: '给 Gemini 发送消息...',
        error: '连接 AI 服务时发生错误。',
        clearSuccess: '历史记录已清除',
        user: '用户',
        settings: '设置',
        theme: '主题',
        language: '语言',
        darkMode: '深色模式',
        lightMode: '浅色模式',
        clearAll: '清除所有对话',
        clearAllConfirm: '确定要删除所有聊天记录吗？',
        feedback: '发送反馈',
        contact: '联系我们',
        logout: '退出登录',
        about: '关于',
        general: '常规',
        send: '发送',
        feedbackPlaceholder: '告诉我们您的想法...',
        feedbackSuccess: '感谢您的反馈！',
        attach: '上传图片'
    }
};

interface ChatInterfaceProps {
    user: { email: string; name?: string };
    onLogout: () => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ user: currentUser, onLogout }) => {
    // --- State ---
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [attachments, setAttachments] = useState<Attachment[]>([]);

    // Settings State
    const [language, setLanguage] = useState<Language>('zh');
    const [themeMode, setThemeMode] = useState<ThemeMode>('light');
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    // Refs & Hooks
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const bottomRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [messageApi, contextHolder] = antMessage.useMessage();

    // Derived State
    const t = translations[language];
    const currentSession = sessions.find(s => s.id === currentSessionId);
    const messages = currentSession?.messages || [];

    // Theme Colors
    const colors = themeMode === 'dark' ? {
        bgLayout: '#343541',
        bgSider: '#202123',
        bgInput: '#40414f',
        text: '#ececf1',
        textSecondary: '#c5c5d2',
        border: '#4d4d4f',
        hover: '#2a2b32',
        userMsgBg: '#343541',
        botMsgBg: '#444654'
    } : {
        bgLayout: '#ffffff',
        bgSider: '#f7f7f8',
        bgInput: '#ffffff',
        text: '#374151',
        textSecondary: '#6b7280',
        border: '#e5e7eb',
        hover: '#ececf1',
        userMsgBg: '#ffffff',
        botMsgBg: '#f7f7f8'
    };

    const scrollToBottom = () => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    // Load Data
    useEffect(() => {
        const savedSessions = localStorage.getItem('chat_sessions');
        const savedSettings = localStorage.getItem('chat_settings');

        if (savedSessions) {
            try {
                const parsed = JSON.parse(savedSessions);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    setSessions(parsed);
                    setCurrentSessionId(parsed[0].id);
                } else {
                    createNewSession();
                }
            } catch (e) { console.error(e); createNewSession(); }
        } else {
            createNewSession();
        }

        if (savedSettings) {
            try {
                const parsed = JSON.parse(savedSettings);
                if (parsed.language) setLanguage(parsed.language);
                if (parsed.theme) setThemeMode(parsed.theme);
            } catch (e) { console.error(e); }
        }
    }, []);

    // Persistence
    useEffect(() => {
        if (sessions.length > 0) {
            localStorage.setItem('chat_sessions', JSON.stringify(sessions));
        }
    }, [sessions]);

    useEffect(() => {
        localStorage.setItem('chat_settings', JSON.stringify({ language, theme: themeMode }));
    }, [language, themeMode]);

    useEffect(() => {
        scrollToBottom();
    }, [messages, isLoading, attachments]);

    // --- Actions ---

    const createNewSession = () => {
        const newSession: ChatSession = {
            id: Date.now().toString(),
            title: t.newChat,
            messages: [],
            timestamp: Date.now()
        };
        setSessions(prev => [newSession, ...prev]);
        setCurrentSessionId(newSession.id);
        setInput('');
        setAttachments([]);
    };

    const deleteSession = (id: string, e?: React.MouseEvent) => {
        e?.stopPropagation();
        const newSessions = sessions.filter(s => s.id !== id);
        setSessions(newSessions);
        if (id === currentSessionId) {
            if (newSessions.length > 0) {
                setCurrentSessionId(newSessions[0].id);
            } else {
                createNewSession();
            }
        }
    };

    const deleteAllSessions = () => {
        setSessions([]);
        localStorage.removeItem('chat_sessions');
        createNewSession();
        messageApi.success(t.clearSuccess);
        setIsSettingsOpen(false);
    };

    const updateCurrentSessionMessages = (newMessages: ChatMessage[]) => {
        if (!currentSessionId) return;
        setSessions(prev => prev.map(session => {
            if (session.id === currentSessionId) {
                let newTitle = session.title;
                // Auto-title
                if (session.messages.length === 0 && newMessages.length > 0 && session.title === t.newChat) {
                    const firstMsg = newMessages[0];
                    if (firstMsg.role === 'user') {
                        // Extract text from parts for title
                        const textPart = firstMsg.parts.find(p => typeof p === 'string') as string | undefined;
                        if (textPart) {
                            newTitle = textPart.slice(0, 24) + (textPart.length > 24 ? '...' : '');
                        } else {
                            newTitle = 'Image Message';
                        }
                    }
                }
                return { ...session, messages: newMessages, title: newTitle, timestamp: Date.now() };
            }
            return session;
        }));
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const files = Array.from(e.target.files);
            processWithFiles(files);
            // Reset input
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const processWithFiles = (files: File[]) => {
        files.forEach(file => {
            if (!file.type.startsWith('image/')) {
                messageApi.warning('Please upload images only.');
                return;
            }
            const reader = new FileReader();
            reader.onload = (e) => {
                const base64String = e.target?.result as string;
                // remove data url prefix for API
                const base64Data = base64String.split(',')[1];
                setAttachments(prev => [...prev, {
                    id: Date.now().toString() + Math.random(),
                    file,
                    preview: base64String,
                    base64: base64Data,
                    mimeType: file.type
                }]);
            };
            reader.readAsDataURL(file);
        });
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
        const items = e.clipboardData?.items;
        if (items) {
            const files: File[] = [];
            for (let i = 0; i < items.length; i++) {
                if (items[i].type.indexOf('image') !== -1) {
                    const blob = items[i].getAsFile();
                    if (blob) {
                        files.push(blob);
                        e.preventDefault(); // Prevent pasting the image binary string
                    }
                }
            }
            if (files.length > 0) {
                processWithFiles(files);
            }
        }
    };


    const removeAttachment = (id: string) => {
        setAttachments(prev => prev.filter(a => a.id !== id));
    };

    const handleSend = async () => {
        if ((!input.trim() && attachments.length === 0) || isLoading || !currentSessionId) return;

        // Construct message content
        const parts: (string | { inlineData: { mimeType: string; data: string } })[] = [];
        if (input.trim()) parts.push(input.trim());
        attachments.forEach(att => {
            parts.push({ inlineData: { mimeType: att.mimeType, data: att.base64 } });
        });

        const userMessage: ChatMessage = { role: 'user', parts };
        const updatedMessages = [...messages, userMessage];
        updateCurrentSessionMessages(updatedMessages);

        setInput('');
        setAttachments([]);
        setIsLoading(true);

        try {
            const responseText = await sendMessageToGemini(updatedMessages, parts);
            updateCurrentSessionMessages([...updatedMessages, { role: 'model', parts: [responseText] }]);
        } catch (error) {
            console.error(error);
            messageApi.error(t.error);
            updateCurrentSessionMessages([...updatedMessages, { role: 'model', parts: [`*${t.error}*`] }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    // --- Render Logic ---

    // Helper to render message parts (text + images)
    const renderMessageContent = (msg: ChatMessage) => {
        return (
            <div className={`prose ${themeMode === 'dark' ? 'prose-invert' : ''} max-w-none`}>
                {msg.parts.map((part, idx) => {
                    if (typeof part === 'string') {
                        return (
                            <ReactMarkdown key={idx} components={{
                                code({ children, className, ...rest }) {
                                    const match = /language-(\w+)/.exec(className || '')
                                    return match ? (
                                        <div style={{ borderRadius: 6, overflow: 'hidden', margin: '12px 0' }}>
                                            <div style={{ background: themeMode === 'dark' ? '#444654' : '#e5e7eb', padding: '6px 12px', fontSize: 12, color: colors.textSecondary }}>
                                                {match[1]}
                                            </div>
                                            <pre style={{ margin: 0, borderRadius: 0 }} className={className}>
                                                <code>{children}</code>
                                            </pre>
                                        </div>
                                    ) : (
                                        <code className={className} {...rest} style={{ background: themeMode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)', padding: '2px 4px', borderRadius: 4 }}>
                                            {children}
                                        </code>
                                    )
                                }
                            }}>
                                {part}
                            </ReactMarkdown>
                        );
                    } else if ('inlineData' in part) {
                        return (
                            <div key={idx} style={{ margin: '10px 0' }}>
                                <Image
                                    src={`data:${part.inlineData.mimeType};base64,${part.inlineData.data}`}
                                    alt="User uploaded attachment"
                                    width={300}
                                    style={{ borderRadius: 8 }}
                                />
                            </div>
                        );
                    }
                    return null;
                })}
            </div>
        );
    };

    const SettingsContent = () => (
        <Tabs defaultActiveKey="1" items={[
            {
                key: '1',
                label: t.general,
                children: (
                    <div className="space-y-6 pt-2">
                        <div className="flex justify-between items-center">
                            <span className="text-sm font-medium">{t.theme}</span>
                            <Select
                                value={themeMode}
                                onChange={setThemeMode}
                                options={[
                                    { value: 'dark', label: <span className="flex items-center gap-2"><Moon size={14} /> {t.darkMode}</span> },
                                    { value: 'light', label: <span className="flex items-center gap-2"><Sun size={14} /> {t.lightMode}</span> },
                                ]}
                                style={{ width: 140 }}
                            />
                        </div>
                        <Divider style={{ margin: '12px 0' }} />
                        <div className="flex justify-between items-center">
                            <span className="text-sm font-medium">{t.language}</span>
                            <Select
                                value={language}
                                onChange={setLanguage}
                                options={[
                                    { value: 'en', label: 'English' },
                                    { value: 'zh', label: '中文 (Chinese)' },
                                ]}
                                style={{ width: 140 }}
                            />
                        </div>
                        <Divider style={{ margin: '12px 0' }} />
                        <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-red-500">{t.clearAll}</span>
                            <Popconfirm
                                title={t.clearAllConfirm}
                                onConfirm={deleteAllSessions}
                                okText={t.delete}
                                cancelText={t.cancel}
                                okButtonProps={{ danger: true }}
                            >
                                <Button danger>{t.clearAll}</Button>
                            </Popconfirm>
                        </div>
                        <Divider style={{ margin: '12px 0' }} />
                        <div className="flex justify-between items-center">
                            <span className="text-sm font-medium">{t.logout}</span>
                            <Button icon={<LogOut size={14} />} onClick={onLogout} danger ghost>
                                {t.logout}
                            </Button>
                        </div>
                    </div>
                )
            },
            {
                key: '2',
                label: t.about,
                children: (
                    <div className="space-y-4 pt-2">
                        <Form layout="vertical" onFinish={async (values) => {
                            try {
                                const res = await fetch('/api/feedback', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ feedback: values.feedback, contact: values.contact })
                                });
                                if (res.ok) {
                                    messageApi.success(t.feedbackSuccess);
                                } else {
                                    messageApi.error('Failed to send feedback.');
                                }
                            } catch (e) {
                                messageApi.error('Error sending feedback.');
                            }
                        }}>
                            <Form.Item label={t.feedback} name="feedback" rules={[{ required: true, message: 'Please input feedback' }]}>
                                <TextArea rows={4} placeholder={t.feedbackPlaceholder} />
                            </Form.Item>
                            <Form.Item label="Contact (Optional)" name="contact" initialValue={currentUser.email}>
                                <Input placeholder="Email or Phone" />
                            </Form.Item>
                            <Button type="primary" htmlType="submit" icon={<MessageCircle size={14} />}>{t.send}</Button>
                        </Form>
                        <Divider plain>{t.contact}</Divider>
                        <div className="flex justify-center gap-4">
                            <Button type="text" icon={<Github size={18} />} href="https://github.com/google/generative-ai" target="_blank">GitHub</Button>
                            <Button type="text" icon={<Mail size={18} />} href="mailto:support@example.com">Email</Button>
                        </div>
                        <div className="text-center text-xs text-gray-400 mt-4">
                            Version 1.0.3 • Powered by Google Gemini
                        </div>
                    </div>
                )
            }
        ]} />
    );

    return (
        <ConfigProvider
            theme={{
                algorithm: themeMode === 'dark' ? antTheme.darkAlgorithm : antTheme.defaultAlgorithm,
                token: {
                    colorPrimary: '#10a37f',
                    borderRadius: 6,
                    colorBgContainer: themeMode === 'dark' ? '#202123' : '#ffffff',
                    colorBgLayout: colors.bgLayout,
                    colorText: colors.text,
                },
            }}
        >
            {contextHolder}
            <Layout style={{ height: '100vh', overflow: 'hidden' }}>
                {/* Sidebar */}
                <Sider
                    width={260}
                    theme={themeMode}
                    style={{
                        background: colors.bgSider,
                        borderRight: `1px solid ${colors.border}`,
                        overflow: 'hidden',
                        height: '100vh',
                        display: 'flex',
                        flexDirection: 'column'
                    }}
                >
                    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                        <div style={{ padding: '12px' }}>
                            <Button
                                onClick={createNewSession}
                                style={{
                                    height: 44, width: '100%', borderRadius: 4,
                                    borderColor: 'rgba(255,255,255,0.2)', background: 'transparent',
                                    color: colors.text, textAlign: 'left', display: 'flex', alignItems: 'center', gap: 12
                                }}
                                className="hover:bg-gray-800 transition-colors"
                            >
                                <Plus size={16} /> {t.newChat}
                            </Button>
                        </div>

                        <div style={{ flex: 1, overflowY: 'auto', padding: '0 12px' }} className="scrollbar-thin">
                            {sessions.length > 0 && <Text type="secondary" style={{ fontSize: 12, padding: '8px 12px', display: 'block' }}>{t.recent}</Text>}
                            <div className="flex flex-col gap-1">
                                {sessions.map((item) => (
                                    <div
                                        key={item.id}
                                        onClick={() => setCurrentSessionId(item.id)}
                                        style={{
                                            width: '100%', padding: '12px', borderRadius: 4, cursor: 'pointer',
                                            background: currentSessionId === item.id ? (themeMode === 'dark' ? '#343541' : '#ececf1') : 'transparent',
                                            color: colors.text, display: 'flex', alignItems: 'center', gap: 12, position: 'relative', marginBottom: 2
                                        }}
                                        className="group transition-colors"
                                    >
                                        <MessageSquare size={16} color={colors.textSecondary} />
                                        <div style={{ flex: 1, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', fontSize: 14, color: currentSessionId === item.id ? colors.text : colors.textSecondary }}>
                                            {item.title}
                                        </div>
                                        {currentSessionId === item.id && (
                                            <div style={{ display: 'flex', gap: 8, position: 'absolute', right: 8, background: currentSessionId === item.id ? (themeMode === 'dark' ? '#343541' : '#ececf1') : 'transparent', paddingLeft: 8 }}>
                                                <Popconfirm
                                                    title={t.deleteConfirm} description={t.deleteDesc}
                                                    onConfirm={(e) => deleteSession(item.id, e)} onCancel={(e) => e?.stopPropagation()}
                                                    okText={t.delete} cancelText={t.cancel} okButtonProps={{ danger: true }}
                                                >
                                                    <Trash2 size={16} className="text-gray-400 hover:text-white cursor-pointer" onClick={(e) => e.stopPropagation()} />
                                                </Popconfirm>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div style={{ padding: '12px', borderTop: `1px solid ${colors.border}` }}>
                            <div
                                onClick={() => setIsSettingsOpen(true)}
                                style={{ padding: '12px', borderRadius: 4, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, color: colors.text }}
                                className={`hover:bg-${themeMode === 'dark' ? 'gray-800' : 'gray-200'} transition-colors`}
                            >
                                <Avatar size="small" icon={<UserOutlined />} />
                                <div style={{ flex: 1, fontSize: 14, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {currentUser.name || currentUser.email || t.user}
                                </div>
                                <Settings size={16} className="text-gray-400" />
                            </div>
                        </div>
                    </div>
                </Sider>

                <Layout style={{ background: colors.bgLayout, position: 'relative' }}>
                    <div style={{
                        position: 'absolute', top: 0, width: '100%', padding: '10px 0', textAlign: 'center', zIndex: 10,
                        color: colors.textSecondary, fontSize: 14, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, background: 'transparent'
                    }}>
                        <span>Gemini 2.5 Flash</span>
                    </div>

                    <Content style={{ height: '100%', overflowY: 'auto', scrollBehavior: 'smooth', paddingBottom: 150 }}>
                        <div style={{ maxWidth: '48rem', margin: '0 auto', padding: '0 24px' }}>
                            {messages.length === 0 && (
                                <div style={{ height: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 24, opacity: 0.8 }}>
                                    <div style={{ padding: 12, background: themeMode === 'dark' ? '#444654' : '#fff', borderRadius: '50%', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
                                        <Bot size={48} color="#10a37f" />
                                    </div>
                                    <Title level={3} style={{ margin: 0 }}>{t.welcome}</Title>
                                    <span style={{ color: colors.textSecondary }}>{t.subtitle}</span>
                                </div>
                            )}

                            <div style={{ display: 'flex', flexDirection: 'column', paddingTop: 60 }}>
                                {messages.map((msg, index) => (
                                    <div key={index} style={{ borderBottom: `1px solid ${themeMode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`, background: msg.role === 'model' ? colors.botMsgBg : colors.userMsgBg }}>
                                        <div style={{ maxWidth: '48rem', margin: '0 auto', padding: '24px 0', display: 'flex', gap: 24 }}>
                                            <div style={{ flexShrink: 0 }}>
                                                {msg.role === 'user' ? (
                                                    <Avatar shape="square" size={30} style={{ backgroundColor: '#5436DA' }} icon={<User size={18} />} />
                                                ) : (
                                                    <Avatar shape="square" size={30} style={{ backgroundColor: '#10a37f' }} icon={<Bot size={18} />} />
                                                )}
                                            </div>
                                            <div style={{ flex: 1, minWidth: 0, lineHeight: 1.6, fontSize: '1rem', color: colors.text }}>
                                                {renderMessageContent(msg)}
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {isLoading && (
                                    <div style={{ background: colors.botMsgBg, padding: '24px 0' }}>
                                        <div style={{ maxWidth: '48rem', margin: '0 auto', display: 'flex', gap: 24, padding: '0 24px' }}>
                                            <Avatar shape="square" size={30} style={{ backgroundColor: '#10a37f' }} icon={<Bot size={18} />} />
                                            <Space>
                                                <Spin />
                                                <span style={{ color: colors.textSecondary }}>{t.thinking}</span>
                                            </Space>
                                        </div>
                                    </div>
                                )}
                                <div ref={bottomRef} />
                            </div>
                        </div>
                    </Content>

                    <div style={{ position: 'absolute', bottom: 0, width: '100%', background: `linear-gradient(180deg, transparent 0%, ${colors.bgLayout} 50%)`, paddingBottom: 24, paddingTop: 48 }}>
                        <div style={{ maxWidth: '48rem', margin: '0 auto', padding: '0 24px', position: 'relative' }}>
                            {/* Attachments Preview */}
                            {attachments.length > 0 && (
                                <div style={{ display: 'flex', gap: 12, marginBottom: 12, overflowX: 'auto', padding: 4 }}>
                                    {attachments.map(att => (
                                        <div key={att.id} style={{ position: 'relative', width: 64, height: 64, borderRadius: 8, overflow: 'hidden', border: `1px solid ${colors.border}` }}>
                                            <img src={att.preview} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            <button
                                                onClick={() => removeAttachment(att.id)}
                                                style={{ position: 'absolute', top: 2, right: 2, background: 'rgba(0,0,0,0.6)', borderRadius: '50%', padding: 2, cursor: 'pointer', border: 'none', color: 'white' }}
                                            >
                                                <X size={12} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div style={{ position: 'relative', boxShadow: '0 0 15px rgba(0,0,0,0.1)', borderRadius: 12, background: colors.bgInput, border: `1px solid ${colors.border}` }}>
                                <input
                                    type="file"
                                    multiple
                                    accept="image/*"
                                    ref={fileInputRef}
                                    onChange={handleFileSelect}
                                    style={{ display: 'none' }}
                                />
                                <div style={{ display: 'flex', alignItems: 'flex-end', padding: 8 }}>
                                    <Tooltip title={t.attach}>
                                        <button
                                            onClick={() => fileInputRef.current?.click()}
                                            style={{ padding: 10, background: 'transparent', border: 'none', color: colors.textSecondary, cursor: 'pointer', borderRadius: 6 }}
                                            className="hover:text-gray-200 hover:bg-white/10"
                                        >
                                            <Paperclip size={20} />
                                        </button>
                                    </Tooltip>
                                    <TextArea
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        onKeyDown={handleKeyPress}
                                        onPaste={handlePaste}
                                        placeholder={t.placeholder}
                                        autoSize={{ minRows: 1, maxRows: 8 }}
                                        style={{ background: 'transparent', border: 'none', color: colors.text, padding: '10px', fontSize: '1rem', lineHeight: 1.5, resize: 'none', flex: 1 }}
                                    />
                                    <button
                                        onClick={handleSend}
                                        disabled={(!input.trim() && attachments.length === 0) || isLoading}
                                        style={{ padding: 8, borderRadius: 6, background: (input.trim() || attachments.length > 0) ? '#10a37f' : 'transparent', color: (input.trim() || attachments.length > 0) ? '#fff' : colors.textSecondary, border: 'none', cursor: (input.trim() || attachments.length > 0) ? 'pointer' : 'default', transition: 'all 0.2s', marginBottom: 2 }}
                                    >
                                        <Send size={18} />
                                    </button>
                                </div>
                            </div>
                            <div style={{ textAlign: 'center', fontSize: 11, color: colors.textSecondary, marginTop: 12 }}>
                                Gemini may display inaccurate info, including about people, so double-check its responses.
                            </div>
                        </div>
                    </div>
                </Layout>

                <Modal
                    title={<div className="flex items-center gap-2"><Settings size={20} /><span>{t.settings}</span></div>}
                    open={isSettingsOpen}
                    onCancel={() => setIsSettingsOpen(false)}
                    footer={[
                        <Button key="logout" icon={<LogOut size={16} />} onClick={() => { messageApi.loading('Logging out...', 1).then(() => window.location.reload()); }} style={{ float: 'left' }}>{t.logout}</Button>,
                        <Button key="ok" type="primary" onClick={() => setIsSettingsOpen(false)}>OK</Button>
                    ]}
                    width={500}
                >
                    <SettingsContent />
                </Modal>
            </Layout>
        </ConfigProvider>
    );
};

export default ChatInterface;
