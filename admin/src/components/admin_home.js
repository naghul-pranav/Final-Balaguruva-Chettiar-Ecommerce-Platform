import React, { useState, useEffect } from 'react';
import Navbar from './Navbar';
import { Box, ShoppingCart, Users, MessageSquare, BarChart2, Settings, Package, 
         AlertTriangle, TrendingUp, ChevronRight, RefreshCw, ArrowUp, ArrowDown,
         Moon, Sun, Calendar, Bell, HelpCircle, Clock, CheckSquare, FileText,
         Zap, Activity, Edit3, PieChart, Filter, Archive, User, Star } from 'lucide-react';
import { Link } from 'react-router-dom';

const MAX_RETRIES = 3;
const RETRY_DELAY = 2000;

// Generate sample data for sparklines
const generateSparklineData = (baseline, variance, points = 12) => {
    return Array.from({length: points}, () => baseline + (Math.random() * variance * 2 - variance));
};

const AdminHome = () => {
    const [products, setProducts] = useState(null);
    const [contacts, setContacts] = useState(null);
    const [users, setUsers] = useState(null);
    const [orders, setOrders] = useState(null);
    const [error, setError] = useState(null);
    const [contactsError, setContactsError] = useState(null);
    const [usersError, setUsersError] = useState(null);
    const [ordersError, setOrdersError] = useState(null);
    const [retryCount, setRetryCount] = useState(0);
    const [userRetryCount, setUserRetryCount] = useState(0);
    const [orderRetryCount, setOrderRetryCount] = useState(0);
    const [darkMode, setDarkMode] = useState(false);
    
    // Add these new state variables
    const [recentActivities, setRecentActivities] = useState([
        { id: 1, type: 'order', message: 'New order #38492 received', time: '10 minutes ago', status: 'success' },
        { id: 2, type: 'user', message: 'New user registration: John Doe', time: '25 minutes ago', status: 'info' },
        { id: 3, type: 'product', message: 'Product "Wireless Headphones" is low on stock', time: '1 hour ago', status: 'warning' },
        { id: 4, type: 'message', message: 'New customer inquiry from Sarah Smith', time: '2 hours ago', status: 'info' },
        { id: 5, type: 'system', message: 'System backup completed successfully', time: '3 hours ago', status: 'success' },
    ]);
    
    const [pendingTasks, setPendingTasks] = useState([
        { id: 1, title: 'Review new orders', priority: 'high', due: '2023-09-30' },
        { id: 2, title: 'Update product descriptions', priority: 'medium', due: '2023-10-05' },
        { id: 3, title: 'Respond to customer inquiries', priority: 'high', due: '2023-09-29' },
        { id: 4, title: 'Schedule inventory restocking', priority: 'medium', due: '2023-10-10' },
    ]);
    
    const [upcomingEvents, setUpcomingEvents] = useState([
        { id: 1, title: 'Marketing Campaign Launch', date: '2023-10-01', type: 'marketing' },
        { id: 2, title: 'Inventory Audit', date: '2023-10-15', type: 'inventory' },
        { id: 3, title: 'Staff Meeting', date: '2023-09-30', type: 'internal' },
        { id: 4, title: 'New Product Launch', date: '2023-10-20', type: 'product' },
    ]);

    // Get current time to display greeting
    const currentHour = new Date().getHours();
    let greeting = "Good morning";
    if (currentHour >= 12 && currentHour < 17) {
        greeting = "Good afternoon";
    } else if (currentHour >= 17) {
        greeting = "Good evening";
    }

    useEffect(() => {
        loadDashboardData();
        loadContactsData();
        loadUsersData();
        loadOrdersData();
        
        // Check for saved theme preference
        const savedTheme = localStorage.getItem('adminDarkMode');
        if (savedTheme === 'true') {
            setDarkMode(true);
            document.body.classList.add('dark-mode');
        }
    }, []);
    
    const toggleDarkMode = () => {
        setDarkMode(prev => {
            const newState = !prev;
            localStorage.setItem('adminDarkMode', newState);
            
            if (newState) {
                document.body.classList.add('dark-mode');
            } else {
                document.body.classList.remove('dark-mode');
            }
            
            return newState;
        });
    };

    const loadDashboardData = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/products');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            setProducts(data);
        } catch (error) {
            console.error('Dashboard error:', error);
            setError('Failed to load product count. Please try again.');
        }
    };

    const loadContactsData = async (retry = true) => {
        try {
            const response = await fetch('http://localhost:5008/api/contacts');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            setContacts(data);
            setContactsError(null);
            setRetryCount(0);
        } catch (error) {
            console.error('Contacts error:', error);
            const errorMessage = 'Failed to load contacts count. Please try again.';
            
            if (retry && retryCount < MAX_RETRIES) {
                setRetryCount(prev => prev + 1);
                setTimeout(() => loadContactsData(true), RETRY_DELAY);
            } else {
                setContactsError(errorMessage);
            }
        }
    };

    const loadUsersData = async (retry = true) => {
        try {
            const response = await fetch('http://localhost:5008/api/users');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            setUsers(data);
            setUsersError(null);
            setUserRetryCount(0);
        } catch (error) {
            console.error('Users error:', error);
            const errorMessage = 'Failed to load users count. Please try again.';
            
            if (retry && userRetryCount < MAX_RETRIES) {
                setUserRetryCount(prev => prev + 1);
                setTimeout(() => loadUsersData(true), RETRY_DELAY);
            } else {
                setUsersError(errorMessage);
            }
        }
    };

    const loadOrdersData = async (retry = true) => {
        try {
            const response = await fetch('http://localhost:5008/api/orders/admin/all');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            // Extract orders array from response
            if (data && data.success && Array.isArray(data.orders)) {
                setOrders(data.orders);
            } else {
                // If response structure is different, try to handle it
                setOrders(Array.isArray(data) ? data : []);
            }
            setOrdersError(null);
            setOrderRetryCount(0);
        } catch (error) {
            console.error('Orders error:', error);
            const errorMessage = 'Failed to load orders count. Please try again.';
            
            if (retry && orderRetryCount < MAX_RETRIES) {
                setOrderRetryCount(prev => prev + 1);
                setTimeout(() => loadOrdersData(true), RETRY_DELAY);
            } else {
                setOrdersError(errorMessage);
            }
        }
    };

    // Calculate total revenue from orders - with robust error handling
    const calculateTotalRevenue = () => {
        // Check if orders exists and is an array
        if (!orders) return 0;
        
        // Handle different possible response structures
        const ordersList = Array.isArray(orders) ? orders : 
                          (orders.orders && Array.isArray(orders.orders)) ? orders.orders : [];
        
        // Safe reduce function with fallback to 0
        try {
            return ordersList.reduce((total, order) => {
                return total + (Number(order.totalPrice) || 0);
            }, 0);
        } catch (error) {
            console.error("Error calculating revenue:", error);
            return 0;
        }
    };

    // Sample trend data for stats
    const statTrends = {
        products: { percentage: 12.5, isUp: true, data: generateSparklineData(15, 5) },
        orders: { percentage: 8.3, isUp: true, data: generateSparklineData(20, 7) },
        messages: { percentage: -3.6, isUp: false, data: generateSparklineData(10, 4) },
        revenue: { percentage: 15.7, isUp: true, data: generateSparklineData(100, 30) },
        users: { percentage: 9.2, isUp: true, data: generateSparklineData(25, 8) }
    };

    const StatCard = ({ icon: Icon, title, value, loading, error, onRetry, iconClass, trend, cardClass }) => {
        const [isHovered, setIsHovered] = useState(false);
        const tooltipText = trend ? 
            `${trend.isUp ? 'Increased' : 'Decreased'} by ${Math.abs(trend.percentage).toFixed(1)}% compared to last month` : '';
        
        // Calculate max height for sparkline normalization
        const maxHeight = trend?.data ? Math.max(...trend.data) : 0;
        
        return (
            <div 
                className={`bg-white rounded-xl shadow-md p-4 relative transition-all duration-300 ${
                    isHovered ? 'shadow-lg transform -translate-y-1' : ''
                } ${
                    cardClass === 'stat-card-primary' ? 'border-l-4 border-purple-500' : 
                    cardClass === 'stat-card-success' ? 'border-l-4 border-green-500' : 
                    cardClass === 'stat-card-warning' ? 'border-l-4 border-orange-500' : 
                    cardClass === 'stat-card-info' ? 'border-l-4 border-blue-500' : ''
                }`}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                <div className="flex items-center mb-3">
                    <div className={`p-2 rounded-full mr-3 transition-transform duration-300 ${
                        iconClass === 'icon-gradient-primary' ? 'bg-purple-100 text-purple-600' : 
                        iconClass === 'icon-gradient-success' ? 'bg-green-100 text-green-600' :
                        iconClass === 'icon-gradient-warning' ? 'bg-orange-100 text-orange-600' :
                        iconClass === 'icon-gradient-info' ? 'bg-blue-100 text-blue-600' : ''
                    } ${isHovered ? 'transform scale-110 rotate-3' : ''}`}>
                        <Icon 
                            size={24} 
                            strokeWidth={1.5}
                        />
                    </div>
                    <div>
                        <h3 className="text-sm font-medium text-gray-500">{title}</h3>
                        {loading ? (
                            <div className="h-6 w-20 bg-gray-200 animate-pulse rounded mt-1"></div>
                        ) : error ? (
                            <div className="flex items-center text-red-500 text-sm mt-1">
                                <AlertTriangle size={14} className="mr-1" />
                                <span className="truncate">{error.split('.')[0]}</span>
                                {onRetry && (
                                    <button 
                                        onClick={onRetry}
                                        className="ml-2 p-1 bg-gray-100 rounded hover:bg-gray-200 flex items-center"
                                    >
                                        <RefreshCw size={12} />
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div className="flex items-center group relative">
                                <div className={`text-xl font-bold ${
                                    title.toLowerCase().includes('revenue') ? 'gradient-text-primary' :
                                    title.toLowerCase().includes('product') ? 'gradient-text-purple' :
                                    title.toLowerCase().includes('user') ? 'gradient-text-blue' :
                                    title.toLowerCase().includes('order') ? 'gradient-text-teal' :
                                    'gradient-text-gold'
                                }`}>
                                    {title.toLowerCase().includes('price') || title.toLowerCase().includes('revenue') 
                                        ? new Intl.NumberFormat('en-IN', {
                                            style: 'currency',
                                            currency: 'INR',
                                            maximumFractionDigits: 0
                                        }).format(value)
                                        : value}
                                </div>
                                {trend && (
                                    <div className={`ml-2 flex items-center text-xs ${
                                        trend.isUp ? 'text-green-600' : 'text-red-600'
                                    }`}>
                                        {trend.isUp ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
                                        <span>{Math.abs(trend.percentage).toFixed(1)}%</span>
                                    </div>
                                )}
                                {tooltipText && (
                                    <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block bg-gray-800 text-white text-xs p-2 rounded pointer-events-none whitespace-nowrap">
                                        {tooltipText}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
                
                {trend?.data && !loading && !error && (
                    <div className="h-10 mt-2">
                        <svg width="100%" height="40" className="overflow-visible">
                            {trend.data.map((value, index) => {
                                const x = (index / (trend.data.length - 1)) * 100 + '%';
                                const y = 40 - ((value / maxHeight) * 30);
                                return (
                                    <circle 
                                        key={index} 
                                        cx={x} 
                                        cy={y} 
                                        r={isHovered ? "2.5" : "1.5"}
                                        className={`transition-all duration-200 ${
                                            trend.isUp ? 'fill-green-400' : 'fill-red-400'
                                        }`}
                                        style={{opacity: 0.3 + (index / trend.data.length) * 0.7}}
                                    />
                                );
                            })}
                            {trend.data.map((value, index, array) => {
                                if (index === 0) return null;
                                const x1 = ((index - 1) / (array.length - 1)) * 100 + '%';
                                const y1 = 40 - ((array[index - 1] / maxHeight) * 30);
                                const x2 = (index / (array.length - 1)) * 100 + '%';
                                const y2 = 40 - ((value / maxHeight) * 30);
                                return (
                                    <line 
                                        key={`line-${index}`}
                                        x1={x1}
                                        y1={y1}
                                        x2={x2}
                                        y2={y2}
                                        strokeWidth={isHovered ? "2" : "1.25"}
                                        className={`transition-all duration-200 ${
                                            trend.isUp ? 'stroke-green-400' : 'stroke-red-400'
                                        }`}
                                    />
                                );
                            })}
                        </svg>
                    </div>
                )}
            </div>
        );
    };

    const DashboardCard = ({ icon: Icon, title, description, link, iconClass }) => {
        const [isHovered, setIsHovered] = useState(false);
        
        return (
            <div 
                className="bg-white rounded-xl shadow-md p-6 flex flex-col transition-all duration-300 hover:shadow-xl"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                <div className={`p-3 rounded-full w-fit mb-4 transition-all duration-300 ${
                    iconClass === 'icon-gradient-primary' ? 'bg-purple-100 text-purple-600' : 
                    iconClass === 'icon-gradient-success' ? 'bg-green-100 text-green-600' :
                    iconClass === 'icon-gradient-info' ? 'bg-blue-100 text-blue-600' : ''
                } ${isHovered ? 'transform scale-110 -translate-y-1' : ''}`}>
                    <Icon 
                        size={32} 
                        strokeWidth={1.5}
                    />
                </div>
                <h3 className="text-xl font-semibold mb-2">{title}</h3>
                <p className="text-gray-600 mb-6 flex-grow">{description}</p>
                <a 
                    href={link} 
                    className="flex items-center text-white bg-indigo-600 hover:bg-indigo-700 py-2 px-4 rounded-md transition-colors duration-200 w-fit"
                >
                    Access {typeof title === 'string' ? title.split(' ')[0] : 
                              typeof title.props.children === 'string' ? title.props.children.split(' ')[0] : 'Section'} 
                    <ChevronRight size={18} className={`ml-1 transition-transform duration-300 ${
                        isHovered ? 'transform translate-x-1' : ''
                    }`}/>
                </a>
            </div>
        );
    };

    // New components for enhanced UI
    const ActivityItem = ({ activity }) => {
        const getIcon = (type) => {
            switch(type) {
                case 'order': return <ShoppingCart size={16} />;
                case 'user': return <User size={16} />;
                case 'product': return <Box size={16} />;
                case 'message': return <MessageSquare size={16} />;
                default: return <Activity size={16} />;
            }
        };
        
        const getStatusColor = (status) => {
            switch(status) {
                case 'success': return 'bg-green-100 text-green-700';
                case 'warning': return 'bg-orange-100 text-orange-700';
                case 'error': return 'bg-red-100 text-red-700';
                default: return 'bg-blue-100 text-blue-700';
            }
        };
        
        return (
            <div className="flex items-start mb-3 pb-3 border-b border-gray-100 last:border-0">
                <div className={`p-2 rounded-full mr-3 ${getStatusColor(activity.status)}`}>
                    {getIcon(activity.type)}
                </div>
                <div className="flex-1">
                    <p className="text-sm text-gray-800">{activity.message}</p>
                    <span className="text-xs text-gray-500 flex items-center mt-1">
                        <Clock size={12} className="mr-1" /> {activity.time}
                    </span>
                </div>
            </div>
        );
    };
    
    const TaskItem = ({ task, onToggleComplete }) => {
        const getPriorityColor = (priority) => {
            switch(priority) {
                case 'high': return 'bg-red-100 text-red-700';
                case 'medium': return 'bg-yellow-100 text-yellow-700';
                default: return 'bg-blue-100 text-blue-700';
            }
        };
        
        const isOverdue = new Date(task.due) < new Date();
        
        return (
            <div className="flex items-center p-3 border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
                <div className="mr-3">
                    <input 
                        type="checkbox" 
                        className="w-4 h-4 accent-indigo-600 cursor-pointer"
                        onChange={() => onToggleComplete(task.id)}
                    />
                </div>
                <div className="flex-1">
                    <p className="text-sm font-medium text-gray-800">{task.title}</p>
                    <div className="flex items-center mt-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${getPriorityColor(task.priority)}`}>
                            {task.priority}
                        </span>
                        <span className={`text-xs ml-2 ${isOverdue ? 'text-red-600' : 'text-gray-500'}`}>
                            {isOverdue ? 'Overdue: ' : 'Due: '} 
                            {new Date(task.due).toLocaleDateString()}
                        </span>
                    </div>
                </div>
                <button className="p-1 text-gray-400 hover:text-gray-600">
                    <Edit3 size={16} />
                </button>
            </div>
        );
    };
    
    const EventItem = ({ event }) => {
        const getEventTypeColor = (type) => {
            switch(type) {
                case 'marketing': return 'bg-purple-100 text-purple-700 border-purple-200';
                case 'inventory': return 'bg-blue-100 text-blue-700 border-blue-200';
                case 'internal': return 'bg-gray-100 text-gray-700 border-gray-200';
                case 'product': return 'bg-green-100 text-green-700 border-green-200';
                default: return 'bg-indigo-100 text-indigo-700 border-indigo-200';
            }
        };
        
        const daysUntil = Math.ceil((new Date(event.date) - new Date()) / (1000 * 60 * 60 * 24));
        
        return (
            <div className={`p-3 mb-2 rounded-lg border ${getEventTypeColor(event.type)}`}>
                <div className="flex justify-between items-start">
                    <h4 className="font-medium text-sm">{event.title}</h4>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-white bg-opacity-50">
                        {event.type}
                    </span>
                </div>
                <div className="flex items-center mt-2 text-xs">
                    <Calendar size={14} className="mr-1" />
                    <span>{new Date(event.date).toLocaleDateString()}</span>
                    {daysUntil > 0 && (
                        <span className="ml-2 px-1.5 py-0.5 bg-white bg-opacity-50 rounded">
                            {daysUntil} day{daysUntil !== 1 ? 's' : ''} left
                        </span>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="hidden">
                <svg>
                    <defs>
                        <linearGradient id="gradient-primary" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#FF0080" />
                            <stop offset="100%" stopColor="#7928CA" />
                        </linearGradient>
                        <linearGradient id="gradient-success" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#00FF87" />
                            <stop offset="100%" stopColor="#60EFFF" />
                        </linearGradient>
                        <linearGradient id="gradient-warning" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#FF8F71" />
                            <stop offset="100%" stopColor="#EF4444" />
                        </linearGradient>
                        <linearGradient id="gradient-info" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#0EA5E9" />
                            <stop offset="100%" stopColor="#6366F1" />
                        </linearGradient>
                        <linearGradient id="text-gradient-gold" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#F59E0B" />
                            <stop offset="100%" stopColor="#D97706" />
                        </linearGradient>
                        <linearGradient id="text-gradient-purple" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#8B5CF6" />
                            <stop offset="100%" stopColor="#6D28D9" />
                        </linearGradient>
                        <linearGradient id="text-gradient-blue" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#3B82F6" />
                            <stop offset="100%" stopColor="#1D4ED8" />
                        </linearGradient>
                        <linearGradient id="text-gradient-teal" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#14B8A6" />
                            <stop offset="100%" stopColor="#0F766E" />
                        </linearGradient>
                    </defs>
                </svg>
            </div>
            
            <style jsx>{`
                .gradient-text-gold {
                    background: -webkit-linear-gradient(#F59E0B, #D97706);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                }
                .gradient-text-purple {
                    background: -webkit-linear-gradient(#8B5CF6, #6D28D9);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                }
                .gradient-text-blue {
                    background: -webkit-linear-gradient(#3B82F6, #1D4ED8);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                }
                .gradient-text-teal {
                    background: -webkit-linear-gradient(#14B8A6, #0F766E);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                }
                .gradient-text-primary {
                    background: -webkit-linear-gradient(#FF0080, #7928CA);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                }
            `}</style>
            
            <button 
                className="fixed top-4 right-4 p-2 rounded-full bg-white shadow-md z-50 hover:bg-gray-100 transition-colors"
                onClick={toggleDarkMode}
            >
                {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            
            <Navbar />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
                <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-8 gap-4">
                    <div>
                        <p className="text-gray-500">{greeting}, <span className="gradient-text-gold font-medium">Admin</span></p>
                        <h2 className="text-2xl font-bold gradient-text-primary">Admin Dashboard</h2>
                    </div>
                    <div className="flex gap-3">
                        <button className="p-2 rounded-full bg-white shadow hover:bg-gray-100 transition-colors relative group">
                            <Bell size={20} />
                            <span className="hidden group-hover:block absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs py-1 px-2 rounded whitespace-nowrap">Notifications</span>
                        </button>
                        <button className="p-2 rounded-full bg-white shadow hover:bg-gray-100 transition-colors relative group">
                            <Calendar size={20} />
                            <span className="hidden group-hover:block absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs py-1 px-2 rounded whitespace-nowrap">Calendar</span>
                        </button>
                        <button className="p-2 rounded-full bg-white shadow hover:bg-gray-100 transition-colors relative group">
                            <HelpCircle size={20} />
                            <span className="hidden group-hover:block absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs py-1 px-2 rounded whitespace-nowrap">Help Center</span>
                        </button>
                    </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
                    <StatCard 
                        icon={Box}
                        title="Total Products"
                        value={products ? products.length : '-'}
                        loading={!products && !error}
                        error={error}
                        onRetry={loadDashboardData}
                        iconClass="icon-gradient-primary"
                        cardClass="stat-card-primary"
                        trend={products ? statTrends.products : null}
                    />
                    <StatCard 
                        icon={Users}
                        title="Total Users"
                        value={users ? users.length : '-'}
                        loading={!users && !usersError}
                        error={usersError}
                        onRetry={() => {
                            setUserRetryCount(0);
                            loadUsersData(true);
                        }}
                        iconClass="icon-gradient-success"
                        cardClass="stat-card-success"
                        trend={users ? statTrends.users : null}
                    />
                    <StatCard 
                        icon={MessageSquare}
                        title="Messages"
                        value={contacts ? contacts.length : '-'}
                        loading={!contacts && !contactsError}
                        error={contactsError}
                        onRetry={() => {
                            setRetryCount(0);
                            loadContactsData(true);
                        }}
                        iconClass="icon-gradient-warning"
                        cardClass="stat-card-warning"
                        trend={contacts ? statTrends.messages : null}
                    />
                    <StatCard 
                        icon={ShoppingCart}
                        title="Orders"
                        value={orders ? (Array.isArray(orders) ? orders.length : 
                              (orders.orders && Array.isArray(orders.orders) ? orders.orders.length : 0)) : '-'}
                        loading={!orders && !ordersError}
                        error={ordersError}
                        onRetry={() => {
                            setOrderRetryCount(0);
                            loadOrdersData(true);
                        }}
                        iconClass="icon-gradient-info"
                        cardClass="stat-card-info"
                        trend={statTrends.orders}
                    />
                    <StatCard 
                        icon={TrendingUp}
                        title="Revenue"
                        value={calculateTotalRevenue()}
                        loading={!orders && !ordersError}
                        error={ordersError}
                        iconClass="icon-gradient-info"
                        cardClass="stat-card-info"
                        trend={statTrends.revenue}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <DashboardCard 
                        icon={Package}
                        title={<span className="gradient-text-purple">Inventory Management</span>}
                        description="Manage your product catalog, track stock levels and update inventory in real-time"
                        link="/products"
                        iconClass="icon-gradient-primary"
                    />
                    <DashboardCard 
                        icon={BarChart2}
                        title={<span className="gradient-text-blue">Sales Analytics</span>}
                        description="View detailed sales reports, customer insights and performance metrics"
                        link="/analytics"
                        iconClass="icon-gradient-success"
                    />
                    <DashboardCard 
                        icon={Settings}
                        title={<span className="gradient-text-teal">System Settings</span>}
                        description="Configure system preferences, user permissions and integration options"
                        link="/settings"
                        iconClass="icon-gradient-info"
                    />
                </div>
                
                {/* Enhanced UI Components - Replace the simple navigation list */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    {/* Recent Activity Section */}
                    <div className="bg-white rounded-xl shadow-md p-4">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-semibold text-lg gradient-text-blue">Recent Activity</h3>
                            <div className="flex space-x-2">
                                <button className="p-1 rounded hover:bg-gray-100">
                                    <Filter size={16} />
                                </button>
                                <button className="p-1 rounded hover:bg-gray-100">
                                    <RefreshCw size={16} />
                                </button>
                            </div>
                        </div>
                        <div className="space-y-1 max-h-80 overflow-y-auto pr-2">
                            {recentActivities.map(activity => (
                                <ActivityItem key={activity.id} activity={activity} />
                            ))}
                        </div>
                        <Link to="/activity" className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center justify-center mt-3 py-2 border-t border-gray-100">
                            View all activity <ChevronRight size={16} />
                        </Link>
                    </div>
                    
                    {/* Tasks Section */}
                    <div className="bg-white rounded-xl shadow-md p-4">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-semibold text-lg gradient-text-purple">Pending Tasks</h3>
                            <button className="text-xs px-2 py-1 bg-indigo-100 text-indigo-700 rounded-full hover:bg-indigo-200">
                                + Add New
                            </button>
                        </div>
                        <div className="max-h-80 overflow-y-auto pr-2">
                            {pendingTasks.map(task => (
                                <TaskItem 
                                    key={task.id} 
                                    task={task} 
                                    onToggleComplete={(id) => {
                                        setPendingTasks(prev => prev.filter(t => t.id !== id));
                                    }} 
                                />
                            ))}
                        </div>
                        <Link to="/tasks" className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center justify-center mt-3 py-2 border-t border-gray-100">
                            View all tasks <ChevronRight size={16} />
                        </Link>
                    </div>
                    
                    {/* Upcoming Events Section */}
                    <div className="bg-white rounded-xl shadow-md p-4">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-semibold text-lg gradient-text-teal">Upcoming Events</h3>
                            <button className="p-1 rounded hover:bg-gray-100">
                                <Calendar size={16} />
                            </button>
                        </div>
                        <div className="space-y-2 max-h-80 overflow-y-auto pr-2">
                            {upcomingEvents.map(event => (
                                <EventItem key={event.id} event={event} />
                            ))}
                        </div>
                        <Link to="/calendar" className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center justify-center mt-3 py-2 border-t border-gray-100">
                            View full calendar <ChevronRight size={16} />
                        </Link>
                    </div>
                </div>
                
                {/* Performance Highlights */}
                <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl shadow-md p-6 text-white mb-8">
                    <div className="flex flex-col sm:flex-row justify-between items-start mb-6 gap-4">
                        <div>
                            <h3 className="font-semibold text-xl">Performance Highlights</h3>
                            <p className="text-indigo-100 text-sm">Last 30 days compared to previous period</p>
                        </div>
                        <button className="bg-white bg-opacity-20 hover:bg-opacity-30 rounded px-3 py-1 text-sm">
                            View Report
                        </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                        <div className="bg-white bg-opacity-10 p-4 rounded-lg">
                            <div className="flex items-center mb-2">
                                <Zap size={18} className="mr-2" />
                                <h4 className="font-medium">Sales Growth</h4>
                            </div>
                            <p className="text-3xl font-bold mb-1">+24.5%</p>
                            <div className="flex items-center text-xs">
                                <ArrowUp size={14} className="mr-1" />
                                <span>12.3% from last month</span>
                            </div>
                        </div>
                        <div className="bg-white bg-opacity-10 p-4 rounded-lg">
                            <div className="flex items-center mb-2">
                                <User size={18} className="mr-2" />
                                <h4 className="font-medium">Customer Retention</h4>
                            </div>
                            <p className="text-3xl font-bold mb-1">82.6%</p>
                            <div className="flex items-center text-xs">
                                <ArrowUp size={14} className="mr-1" />
                                <span>3.2% from last month</span>
                            </div>
                        </div>
                        <div className="bg-white bg-opacity-10 p-4 rounded-lg">
                            <div className="flex items-center mb-2">
                                <Star size={18} className="mr-2" />
                                <h4 className="font-medium">Avg. Rating</h4>
                            </div>
                            <p className="text-3xl font-bold mb-1">4.8/5</p>
                            <div className="flex items-center text-xs">
                                <ArrowUp size={14} className="mr-1" />
                                <span>0.3 from last month</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminHome;
