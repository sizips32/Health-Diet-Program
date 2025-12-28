import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Calendar, Activity, Utensils, Clock, Heart,
    TrendingDown, AlertCircle, ChevronRight, CheckCircle2,
    PieChart, Settings, Home, Info, Droplets, Moon, Sun,
    Plus, ArrowRight, Loader2, Target, Zap, Brain,
    Dumbbell, Sparkles, LogOut, ChevronLeft
} from 'lucide-react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, AreaChart, Area,
    BarChart, Bar, Cell
} from 'recharts';
import { GoogleGenerativeAI } from "@google/generative-ai";

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// Mock Data for Progress Tracking
const mockProgressData = [
    { day: 'Day 1', level: 250 },
    { day: 'Day 2', level: 242 },
    { day: 'Day 3', level: 235 },
    { day: 'Day 4', level: 228 },
    { day: 'Day 5', level: 220 },
    { day: 'Day 6', level: 212 },
    { day: 'Day 7', level: 205 },
];

const TriglycerideApp = () => {
    const [step, setStep] = useState('input'); // input, generating, dashboard
    const [activeTab, setActiveTab] = useState('today'); // today, analytics, guide, settings
    const [userInfo, setUserInfo] = useState({
        currentLevel: '',
        wakeTime: '06:00',
        sleepTime: '22:00',
        workSchedule: 'standard',
        exerciseLevel: 'beginner',
        dietaryPreference: 'general'
    });
    const [schedule, setSchedule] = useState(null);
    const [selectedDayIndex, setSelectedDayIndex] = useState(0);
    const [loading, setLoading] = useState(false);
    const [completions, setCompletions] = useState({}); // { 'day-idx-hour': boolean }

    const dynamicProgressData = useMemo(() => {
        const startLevel = parseInt(userInfo.currentLevel) || 250;
        return Array.from({ length: 7 }, (_, i) => ({
            day: `Day ${i + 1}`,
            level: Math.round(startLevel * (1 - (i * 0.03)))
        }));
    }, [userInfo.currentLevel]);

    const toggleCompletion = (dayIdx, hourIdx) => {
        const key = `${dayIdx}-${hourIdx}`;
        setCompletions(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const calculateProgress = () => {
        if (!schedule) return 0;
        const totalTasks = schedule.weekSchedule[selectedDayIndex].hourlySchedule.length;
        const completedTasks = schedule.weekSchedule[selectedDayIndex].hourlySchedule.filter((_, i) => completions[`${selectedDayIndex}-${i}`]).length;
        return Math.round((completedTasks / totalTasks) * 100);
    };

    const generateSchedule = async () => {
        if (!GEMINI_API_KEY) {
            // Fallback if no API Key
            setLoading(true);
            setStep('generating');
            setTimeout(() => {
                setSchedule(getSampleSchedule());
                setStep('dashboard');
                setLoading(false);
            }, 2000);
            return;
        }

        setLoading(true);
        setStep('generating');

        try {
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
            const prompt = `
        Base on this user profile, create a highly detailed, non-repetitive 7-day triglyceride management program in JSON.
        Profile:
        - Current TG Level: ${userInfo.currentLevel} mg/dL
        - Wake: ${userInfo.wakeTime}, Sleep: ${userInfo.sleepTime}
        - Diet: ${userInfo.dietaryPreference}
        
        Requirements for JSON:
        1. "weekSchedule": Array of 7 days.
        2. Each day must have a central "theme" (unique for each day, e.g., "심폐 강화의 날", "오메가-3 충전의 날").
        3. "hourlySchedule": 5-7 events per day (time, activity, category[meal/exercise/general], details, benefit).
        4. "dailySummary": An object with "fastingWindow" (e.g., "14시간") and "intensity" (e.g., "중강도").
        5. Vary the exercise types and meals for each day to avoid repetition.
        6. Return ONLY the JSON object. No Markdown.
        7. Language: Korean.
      `;

            const result = await model.generateContent(prompt);
            const text = result.response.text();
            const cleanedJson = text.replace(/```json|```/g, "").trim();
            const parsedData = JSON.parse(cleanedJson);
            setSchedule(parsedData);
            setStep('dashboard');
        } catch (error) {
            console.error("AI Generation Error:", error);
            setSchedule(getSampleSchedule());
            setStep('dashboard');
        } finally {
            setLoading(false);
        }
    };

    const getSampleSchedule = () => ({
        weekSchedule: [
            {
                day: '월요일',
                theme: '메타 활성 월요일',
                hourlySchedule: [
                    { time: "06:00", activity: "따뜻한 레몬수", category: "general", details: "기상 후 300ml 섭취", benefit: "간 해독 지원" },
                    { time: "07:30", activity: "공복 파워 워킹", category: "exercise", details: "30분간 빠르게 걷기", benefit: "체지방 연소 극대화" },
                    { time: "12:30", activity: "지중해식 샐러드", category: "meal", details: "병아리콩, 아보카도, 올리브유", benefit: "HDL 콜레스테롤 상승" },
                    { time: "18:30", activity: "구운 두부와 채소", category: "meal", details: "식이섬유 위주의 가벼운 저녁", benefit: "야간 중성지방 합성 억제" },
                    { time: "22:00", activity: "정적 스트레칭", category: "general", details: "수면 전 이완", benefit: "숙면 유도" }
                ],
                dailySummary: { fastingWindow: "14시간", intensity: "중강도" }
            },
            {
                day: '화요일',
                theme: '오메가-3 화요일',
                hourlySchedule: [
                    { time: "06:30", activity: "수분 보충", category: "general", details: "물 2컵", benefit: "혈액 순환 원활" },
                    { time: "12:00", activity: "고등어 구이", category: "meal", details: "등푸른 생선과 쌈채소", benefit: "중성지방 수치 개선" },
                    { time: "17:00", activity: "계단 오르기", category: "exercise", details: "15분간 하체 강화", benefit: "인슐린 저항성 개선" },
                    { time: "19:00", activity: "현미밥과 정갈한 반찬", category: "meal", details: "복합 탄수화물 섭취", benefit: "혈당 스파이크 방지" },
                    { time: "22:30", activity: "명상", category: "general", details: "심신 안정", benefit: "대사 호르몬 조절" }
                ],
                dailySummary: { fastingWindow: "12시간", intensity: "저강도" }
            },
            {
                day: '수요일',
                theme: '근력 강화 수요일',
                hourlySchedule: [
                    { time: "07:00", activity: "요가 20분", category: "exercise", details: "유연성 및 혈류 개선", benefit: "전신 순환" },
                    { time: "12:30", activity: "닭가슴살 샐러드", category: "meal", details: "견과류 토핑 추가", benefit: "단백질 공급" },
                    { time: "15:00", activity: "견과류 섭취", category: "general", details: "아몬드 5알", benefit: "건강한 지방 섭취" },
                    { time: "19:00", activity: "연어 스테이크", category: "meal", details: "구운 아스파라거스 곁들임", benefit: "항염 작용" },
                    { time: "21:30", activity: "반신욕", category: "general", details: "체온 조절", benefit: "노폐물 배출" }
                ],
                dailySummary: { fastingWindow: "13시간", intensity: "중강도" }
            },
            {
                day: '목요일',
                theme: '디톡스 목요일',
                hourlySchedule: [
                    { time: "07:30", activity: "녹차 한 잔", category: "general", details: "항산화 성분 섭취", benefit: "지방 연소 촉진" },
                    { time: "12:30", activity: "비빔밥 (보리밥)", category: "meal", details: "나물 위주, 고추장 소량", benefit: "식이섬유 극대화" },
                    { time: "18:00", activity: "조깅 30분", category: "exercise", details: "중강도 유산소", benefit: "여분 에너지 소비" },
                    { time: "20:00", activity: "야채 수프", category: "meal", details: "따뜻한 채소찜", benefit: "소화 부담 경감" },
                    { time: "22:00", activity: "수면 모드", category: "general", details: "암막 환경 조성", benefit: "성장 호르몬 촉진" }
                ],
                dailySummary: { fastingWindow: "15시간", intensity: "고강도" }
            },
            {
                day: '금요일',
                theme: '지구력 금요일',
                hourlySchedule: [
                    { time: "06:30", activity: "플랭크 3분", category: "exercise", details: "코어 근육 강화", benefit: "기초 대사량 증진" },
                    { time: "12:30", activity: "해산물 파스타", category: "meal", details: "통밀면 사용", benefit: "느린 탄수화물 흡수" },
                    { time: "15:30", activity: "블루베리 요거트", category: "meal", details: "무가당 요거트", benefit: "장내 미생물 환경 개선" },
                    { time: "19:00", activity: "오리 로스구이", category: "meal", details: "불포화 지방산", benefit: "혈관 건강 지원" },
                    { time: "22:00", activity: "폼롤러 마사지", category: "general", details: "근육 뭉침 해소", benefit: "피로 회복" }
                ],
                dailySummary: { fastingWindow: "12시간", intensity: "중강도" }
            },
            {
                day: '토요일',
                theme: '밸런스 토요일',
                hourlySchedule: [
                    { time: "09:00", activity: "늦은 아침 산책", category: "exercise", details: "가족과 함께 걷기", benefit: "스트레스 해소" },
                    { time: "13:00", activity: "콩국수", category: "meal", details: "콩 단백질 듬뿍", benefit: "저지방 고단백" },
                    { time: "16:00", activity: "취미 활동", category: "general", details: "적극적인 휴식", benefit: "정서적 안정" },
                    { time: "18:30", activity: "샤브샤브", category: "meal", details: "채소 위주의 식사", benefit: "포만감 유지" },
                    { time: "21:00", activity: "독서", category: "general", details: "디지털 디톡스", benefit: "뇌 휴식" }
                ],
                dailySummary: { fastingWindow: "14시간", intensity: "저강도" }
            },
            {
                day: '일요일',
                theme: '리프레시 일요일',
                hourlySchedule: [
                    { time: "08:30", activity: "충분한 수면", category: "general", details: "신체 회복 시간", benefit: "컨디션 조절" },
                    { time: "12:30", activity: "브런치 (오물렛)", category: "meal", details: "시금치와 버섯 추가", benefit: "영양 균형" },
                    { time: "15:00", activity: "등산 또는 하이킹", category: "exercise", details: "자연 속 운동", benefit: "심폐 기능 강화" },
                    { time: "18:00", activity: "해조류 샐러드", category: "meal", details: "미역, 다시마 등", benefit: "중성지방 배출 도움" },
                    { time: "21:00", activity: "주간 피드백", category: "general", details: "다음 주 계획 수립", benefit: "목표 의식 고취" }
                ],
                dailySummary: { fastingWindow: "16시간", intensity: "중강도" }
            }
        ],
        weeklyGuidelines: {
            dietaryPrinciples: [
                "정제 탄수환물(밀가루, 설탕) 90% 제한",
                "액상과당 포함 음료 전면 배제",
                "음주 횟수 주 1회 미만으로 제한"
            ],
            expectedProgress: "4주 내 수치 15-20% 감소 예상"
        }
    });

    const getCategoryConfig = (category) => {
        switch (category) {
            case 'meal': return {
                theme: 'from-emerald-400 to-teal-500 shadow-emerald-200',
                icon: <Utensils className="w-5 h-4" />,
                badge: 'bg-emerald-100 text-emerald-700'
            };
            case 'exercise': return {
                theme: 'from-blue-400 to-indigo-500 shadow-blue-200',
                icon: <Activity className="w-5 h-4" />,
                badge: 'bg-blue-100 text-blue-700'
            };
            case 'general': return {
                theme: 'from-amber-400 to-orange-500 shadow-orange-200',
                icon: <Droplets className="w-5 h-4" />,
                badge: 'bg-orange-100 text-orange-700'
            };
            default: return {
                theme: 'from-gray-400 to-gray-500 shadow-gray-200',
                icon: <Activity className="w-5 h-4" />,
                badge: 'bg-gray-100 text-gray-700'
            };
        }
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] flex font-sans text-slate-900">
            {/* Sidebar Navigation */}
            {step === 'dashboard' && (
                <nav className="w-20 lg:w-64 bg-white border-r border-slate-200 flex flex-col items-center lg:items-start p-4 lg:p-6 transition-all">
                    <div className="flex items-center gap-3 mb-10 w-full px-2">
                        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                            <Activity className="w-6 h-6" />
                        </div>
                        <span className="font-bold text-xl hidden lg:block text-slate-800">HealthAI</span>
                    </div>

                    <div className="flex-1 w-full space-y-2">
                        {[
                            { id: 'today', icon: <Home />, label: '오늘의 루틴' },
                            { id: 'analytics', icon: <PieChart />, label: '데이터 분석' },
                            { id: 'guide', icon: <Info />, label: '전문 가이드' },
                            { id: 'settings', icon: <Settings />, label: '설정' }
                        ].map(item => (
                            <button
                                key={item.id}
                                onClick={() => setActiveTab(item.id)}
                                className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${activeTab === item.id
                                    ? 'bg-indigo-50 text-indigo-700 shadow-sm'
                                    : 'text-slate-500 hover:bg-slate-50'
                                    }`}
                            >
                                {React.cloneElement(item.icon, { className: 'w-6 h-6' })}
                                <span className="font-medium hidden lg:block">{item.label}</span>
                            </button>
                        ))}
                    </div>

                    <div className="mt-auto w-full pt-6 border-t border-slate-100">
                        <button
                            onClick={() => setStep('input')}
                            className="w-full flex items-center gap-3 p-3 rounded-xl text-rose-500 hover:bg-rose-50 transition-all"
                        >
                            <TrendingDown className="w-6 h-6" />
                            <span className="font-medium hidden lg:block">다시 설정</span>
                        </button>
                    </div>
                </nav>
            )}

            {/* Main Content Area */}
            <main className="flex-1 overflow-y-auto">
                <AnimatePresence mode="wait">
                    {step === 'input' && (
                        <motion.div
                            key="input"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="max-w-3xl mx-auto py-12 px-6"
                        >
                            <div className="text-center mb-10">
                                <span className="inline-block px-4 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-bold mb-4">
                                    Lipid Care v2.0
                                </span>
                                <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 mb-4">
                                    중성지방 관리, <br /> 데이터로 더 정교하게.
                                </h1>
                                <p className="text-lg text-slate-600">당신의 생활 패턴에 맞춘 7일간의 집중 케어 솔루션</p>
                            </div>

                            <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8 space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2 px-1">현재 중성지방 수치</label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                value={userInfo.currentLevel}
                                                onChange={e => setUserInfo({ ...userInfo, currentLevel: e.target.value })}
                                                className="w-full h-14 bg-slate-50 border-none rounded-2xl px-5 text-lg focus:ring-2 focus:ring-indigo-500 transition-all font-semibold"
                                                placeholder="mg/dL"
                                            />
                                            <span className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 font-medium">mg/dL</span>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2 px-1">식단 선호도</label>
                                        <select
                                            value={userInfo.dietaryPreference}
                                            onChange={e => setUserInfo({ ...userInfo, dietaryPreference: e.target.value })}
                                            className="w-full h-14 bg-slate-50 border-none rounded-2xl px-5 text-lg focus:ring-2 focus:ring-indigo-500 transition-all font-semibold appearance-none"
                                        >
                                            <option value="general">일반식</option>
                                            <option value="korean">한식 위주</option>
                                            <option value="vegetarian">채식 중심</option>
                                            <option value="pescatarian">생선 포함 채식</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-8">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2 px-1 text-center">기상 시간</label>
                                        <input
                                            type="time"
                                            value={userInfo.wakeTime}
                                            onChange={e => setUserInfo({ ...userInfo, wakeTime: e.target.value })}
                                            className="w-full h-14 bg-slate-50 border-none rounded-2xl px-4 text-center text-lg focus:ring-2 focus:ring-indigo-500 transition-all font-semibold"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2 px-1 text-center">취침 시간</label>
                                        <input
                                            type="time"
                                            value={userInfo.sleepTime}
                                            onChange={e => setUserInfo({ ...userInfo, sleepTime: e.target.value })}
                                            className="w-full h-14 bg-slate-50 border-none rounded-2xl px-4 text-center text-lg focus:ring-2 focus:ring-indigo-500 transition-all font-semibold"
                                        />
                                    </div>
                                </div>

                                <button
                                    onClick={generateSchedule}
                                    disabled={!userInfo.currentLevel || loading}
                                    className="w-full h-16 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-3xl font-bold text-xl shadow-lg shadow-indigo-200 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                                >
                                    {loading ? (
                                        <Loader2 className="w-6 h-6 animate-spin" />
                                    ) : (
                                        <>분석 및 스케줄 생성 <ArrowRight className="w-6 h-6" /></>
                                    )}
                                </button>

                                <div className="flex gap-4 p-5 bg-amber-50 rounded-2xl border border-amber-100">
                                    <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0" />
                                    <p className="text-sm text-amber-800 leading-relaxed font-medium">
                                        본 서비스는 AI 기반의 가이드를 제공합니다. 수치가 500mg/dL 이상인 경우 급성 췌장염 위험도가 높으므로 전문의와 즉시 상담하시기 바랍니다.
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {step === 'generating' && (
                        <motion.div
                            key="generating"
                            className="h-full flex flex-col items-center justify-center p-6 text-center"
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        >
                            <div className="relative mb-10">
                                <div className="w-24 h-24 border-8 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
                                <Activity className="w-10 h-10 text-indigo-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                            </div>
                            <h2 className="text-3xl font-bold text-slate-800 mb-4">맞춤형 플랜 생성 중...</h2>
                            <p className="text-slate-500 text-lg">당신의 혈관 건강을 위한 최적의 식단과 운동 경로를 계산하고 있습니다.</p>
                        </motion.div>
                    )}

                    {step === 'dashboard' && (
                        <motion.div
                            key="dashboard"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="p-6 lg:p-10 space-y-8"
                        >
                            {/* Header Info */}
                            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                                <div>
                                    <h2 className="text-sm font-bold text-indigo-600 uppercase tracking-widest mb-2">Today Overall</h2>
                                    <h1 className="text-4xl font-black text-slate-900 flex items-center gap-4">
                                        {schedule.weekSchedule[selectedDayIndex].day} 관리 리포트
                                        <span className="text-sm font-bold px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full">
                                            {schedule.weekSchedule[selectedDayIndex].theme || '데일리 케어'}
                                        </span>
                                    </h1>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-3">
                                        <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center text-rose-600">
                                            <TrendingDown className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-slate-400">Current Level</p>
                                            <p className="text-lg font-black text-slate-800">{userInfo.currentLevel} <span className="text-xs font-medium text-slate-500">mg/dL</span></p>
                                        </div>
                                    </div>
                                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-3">
                                        <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
                                            <CheckCircle2 className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-slate-400">Completion</p>
                                            <p className="text-lg font-black text-slate-800">{calculateProgress()}%</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Weekly Day Selector */}
                            <div className="bg-slate-200/50 p-1.5 rounded-2xl flex gap-1 overflow-x-auto no-scrollbar">
                                {schedule.weekSchedule.map((day, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setSelectedDayIndex(idx)}
                                        className={`flex-1 min-w-[100px] py-4 rounded-xl font-bold transition-all ${selectedDayIndex === idx
                                            ? 'bg-white text-indigo-600 shadow-md transform scale-[1.02]'
                                            : 'text-slate-500 hover:text-slate-700'
                                            }`}
                                    >
                                        {day.day}
                                    </button>
                                ))}
                            </div>

                            {activeTab === 'today' && (
                                <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                                    {/* Timeline Column */}
                                    <div className="xl:col-span-2 space-y-4">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                                <Clock className="w-6 h-6 text-slate-400" /> 시간별 맞춤 루틴
                                            </h3>
                                            <button className="text-sm font-bold text-indigo-600 hover:bg-indigo-50 px-3 py-1.5 rounded-lg transition-all">전체 완료처리</button>
                                        </div>

                                        <div className="space-y-6 relative before:absolute before:left-[27px] before:top-4 before:bottom-4 before:w-0.5 before:bg-slate-100">
                                            {schedule.weekSchedule[selectedDayIndex].hourlySchedule.map((item, idx) => (
                                                <motion.div
                                                    key={idx}
                                                    initial={{ opacity: 0, x: -10 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: idx * 0.1 }}
                                                    className="flex gap-6 items-start group"
                                                >
                                                    <button
                                                        onClick={() => toggleCompletion(selectedDayIndex, idx)}
                                                        className={`z-10 w-14 h-14 rounded-2xl flex items-center justify-center transition-all shadow-lg ${completions[`${selectedDayIndex}-${idx}`]
                                                            ? 'bg-emerald-500 text-white shadow-emerald-100 scale-95'
                                                            : `bg-gradient-to-br ${getCategoryConfig(item.category).theme} text-white`
                                                            }`}
                                                    >
                                                        {completions[`${selectedDayIndex}-${idx}`] ? <CheckCircle2 className="w-7 h-7" /> : getCategoryConfig(item.category).icon}
                                                    </button>

                                                    <div className={`flex-1 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm transition-all group-hover:shadow-md ${completions[`${selectedDayIndex}-${idx}`] ? 'opacity-50 scale-[0.98]' : ''}`}>
                                                        <div className="flex justify-between items-start mb-2">
                                                            <div>
                                                                <span className="text-sm font-black text-slate-400 uppercase">{item.time}</span>
                                                                <h4 className="text-xl font-bold text-slate-800">{item.activity}</h4>
                                                            </div>
                                                            <span className={`px-3 py-1 rounded-full text-xs font-black uppercase ${getCategoryConfig(item.category).badge}`}>
                                                                {item.category}
                                                            </span>
                                                        </div>
                                                        <p className="text-slate-600 mb-4 leading-relaxed font-medium">{item.details}</p>
                                                        <div className="bg-slate-50 p-3 rounded-2xl flex items-start gap-2">
                                                            <Heart className="w-4 h-4 text-rose-500 mt-1 flex-shrink-0" />
                                                            <p className="text-xs font-bold text-slate-500 leading-tight">
                                                                <span className="text-slate-800">Benefit:</span> {item.benefit}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Summary & Analytics Sidebar */}
                                    <div className="space-y-6">
                                        {/* Progress Chart */}
                                        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                                            <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                                                <Activity className="w-5 h-5 text-indigo-500" /> 예상 수치 가이드
                                            </h3>
                                            <div className="h-48 w-full">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <AreaChart data={dynamicProgressData}>
                                                        <defs>
                                                            <linearGradient id="colorLevel" x1="0" y1="0" x2="0" y2="1">
                                                                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1} />
                                                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                                            </linearGradient>
                                                        </defs>
                                                        <Area type="monotone" dataKey="level" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorLevel)" />
                                                        <Tooltip
                                                            contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                                        />
                                                    </AreaChart>
                                                </ResponsiveContainer>
                                            </div>
                                            <div className="mt-4 p-4 bg-indigo-50 rounded-2xl">
                                                <p className="text-xs font-bold text-indigo-800 leading-tight">
                                                    플랜을 85% 이상 준수할 경우, 7일 뒤 예상 수치는 <span className="text-lg">{dynamicProgressData[6].level}</span><span className="text-[10px] ml-1">mg/dL</span> 입니다.
                                                </p>
                                            </div>
                                        </div>

                                        {/* Daily Stats */}
                                        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                                            <h3 className="text-lg font-bold text-slate-800 mb-4">오늘의 핵심 통계</h3>
                                            <div className="grid grid-cols-1 gap-3">
                                                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                                                    <span className="text-sm font-bold text-slate-500">공복 시간</span>
                                                    <span className="font-black text-slate-800">{schedule.weekSchedule[selectedDayIndex].dailySummary.fastingWindow}</span>
                                                </div>
                                                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                                                    <span className="text-sm font-bold text-slate-500">운동 강도</span>
                                                    <div className="flex gap-1">
                                                        {[1, 2, 3, 4, 5].map(s => (
                                                            <div key={s} className={`w-1.5 h-4 rounded-full ${s <= 3 ? 'bg-indigo-500' : 'bg-slate-200'}`}></div>
                                                        ))}
                                                    </div>
                                                </div>
                                                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                                                    <span className="text-sm font-bold text-slate-500">식이 섬유</span>
                                                    <span className="font-black text-emerald-600">High</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Meal Tips Card */}
                                        <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-6 rounded-3xl text-white shadow-xl shadow-indigo-100 relative overflow-hidden">
                                            <div className="relative z-10">
                                                <Utensils className="w-8 h-8 mb-4 text-indigo-200" />
                                                <h4 className="text-xl font-bold mb-2">오늘의 슈퍼푸드</h4>
                                                <p className="text-indigo-100 text-sm mb-4">중성지방 청소부 '아보카도'</p>
                                                <button className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-xl text-xs font-bold transition-all backdrop-blur-sm">상세 효능보기</button>
                                            </div>
                                            <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'analytics' && (
                                <div className="space-y-8">
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
                                            <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                                                <Zap className="w-6 h-6 text-yellow-500" /> 에너지 활성도 분석
                                            </h3>
                                            <div className="h-64">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <BarChart data={dynamicProgressData}>
                                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                                        <XAxis dataKey="day" />
                                                        <YAxis />
                                                        <Tooltip />
                                                        <Bar dataKey="level" fill="#6366f1" radius={[10, 10, 0, 0]}>
                                                            {dynamicProgressData.map((entry, index) => (
                                                                <Cell key={`cell-${index}`} fill={index === selectedDayIndex ? '#4f46e5' : '#e2e8f0'} />
                                                            ))}
                                                        </Bar>
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </div>

                                        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
                                            <div className="flex items-center gap-3 mb-6">
                                                <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600">
                                                    <Brain className="w-6 h-6" />
                                                </div>
                                                <h3 className="text-xl font-bold text-slate-800">AI 행동 통찰</h3>
                                            </div>
                                            <div className="space-y-4">
                                                <div className="p-4 bg-slate-50 rounded-2xl border-l-4 border-indigo-500">
                                                    <p className="text-sm font-bold text-slate-800 mb-1">식후 혈당 스파이크 주의</p>
                                                    <p className="text-xs text-slate-500 leading-relaxed">점심 식사 후 30분 뒤의 가벼운 산책이 중성지방 수치를 15% 더 빠르게 낮추는 것으로 분석되었습니다.</p>
                                                </div>
                                                <div className="p-4 bg-slate-50 rounded-2xl border-l-4 border-emerald-500">
                                                    <p className="text-sm font-bold text-slate-800 mb-1">오메가-3 섭취 최적화</p>
                                                    <p className="text-xs text-slate-500 leading-relaxed">현재 식단 패턴에서 등푸른 생선 섭취를 주 1회 더 늘리면 혈전 예방 효과가 극대화됩니다.</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'guide' && (
                                <div className="space-y-8">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        {[
                                            { icon: <Droplets className="text-sky-500" />, title: "수분 섭취 가이드", desc: "하루 2L 이상의 미온수는 혈액 농도를 조절하고 대사를 돕습니다." },
                                            { icon: <Dumbbell className="text-rose-500" />, title: "효율적인 운동법", desc: "유산소와 근력 운동의 황금 비율은 7:3입니다. 식후 1시간 뒤를 노리세요." },
                                            { icon: <Sparkles className="text-amber-500" />, title: "영양제 매칭", desc: "오메가-3와 코큐텐은 중성지방 수치 개선에 시너지를 냅니다." }
                                        ].map((guide, i) => (
                                            <div key={i} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
                                                <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center mb-4 text-2xl">
                                                    {guide.icon}
                                                </div>
                                                <h4 className="font-bold text-slate-800 mb-2">{guide.title}</h4>
                                                <p className="text-sm text-slate-500 leading-relaxed">{guide.desc}</p>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="bg-slate-900 border border-slate-800 p-8 rounded-[40px] text-white overflow-hidden relative">
                                        <div className="relative z-10">
                                            <h3 className="text-2xl font-bold mb-4">전문가 1:1 조언</h3>
                                            <p className="text-slate-400 mb-6 max-w-md">중성지방은 식습관 변화만으로도 4주 내에 드라마틱한 변화를 보일 수 있는 항목입니다. 포기하지 마세요.</p>
                                            <button className="bg-white text-slate-900 px-6 py-3 rounded-2xl font-bold text-sm">상세 가이드북 내려받기</button>
                                        </div>
                                        <Activity className="absolute -right-10 -bottom-10 w-64 h-64 text-white/5" />
                                    </div>
                                </div>
                            )}

                            {activeTab === 'settings' && (
                                <div className="max-w-xl mx-auto space-y-6">
                                    <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-8">
                                        <h3 className="text-2xl font-bold text-slate-800 px-1">개인 설정</h3>

                                        <div className="space-y-6">
                                            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                                                <div>
                                                    <p className="font-bold text-slate-800">푸시 알림</p>
                                                    <p className="text-xs text-slate-500">루틴 시간이 되면 알림을 받습니다.</p>
                                                </div>
                                                <div className="w-12 h-6 bg-indigo-600 rounded-full relative shadow-inner cursor-pointer">
                                                    <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                                                <div>
                                                    <p className="font-bold text-slate-800">데이터 백업</p>
                                                    <p className="text-xs text-slate-500">클라우드에 데이터를 동기화합니다.</p>
                                                </div>
                                                <button className="text-indigo-600 font-bold text-sm">지금 실행</button>
                                            </div>

                                            <div className="pt-4">
                                                <button
                                                    onClick={() => setStep('input')}
                                                    className="w-full py-4 bg-rose-50 text-rose-600 rounded-2xl font-bold flex items-center justify-center gap-2"
                                                >
                                                    <LogOut className="w-5 h-5" /> 모든 데이터 초기화
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>

            {/* Quick Add Floating Button */}
            {step === 'dashboard' && (
                <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className="fixed bottom-8 right-8 w-16 h-16 bg-indigo-600 text-white rounded-full shadow-2xl shadow-indigo-300 flex items-center justify-center z-50"
                >
                    <Plus className="w-8 h-8" />
                </motion.button>
            )}
        </div>
    );
};

export default TriglycerideApp;
