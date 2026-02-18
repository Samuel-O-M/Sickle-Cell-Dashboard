import { useEffect, useState, useMemo, useRef } from 'react'

import Papa from 'papaparse'

import {
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    CartesianGrid,
    XAxis,
    YAxis,
    Tooltip,
    Legend
} from 'recharts'


function Fundraising() {

    const [data, setData] = useState([])
    const [loading, setLoading] = useState(true)
    const [currentCarousel, setCurrentCarousel] = useState({})
    const [visibleGalleries, setVisibleGalleries] = useState(new Set(['chapel'])) // Load first gallery
    const [imageLoading, setImageLoading] = useState({})
    const [isScrolled, setIsScrolled] = useState(false) 
    const [activeGalleryKey, setActiveGalleryKey] = useState('chapel') // Default to first gallery
    const [isDropdownOpen, setIsDropdownOpen] = useState(false)

    const galleryRefs = useRef({})
    
    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 50)
        }
        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    useEffect(() => {
        setLoading(true)
        fetch('/fundraising.csv')
            .then((response) => response.text())
            .then((text) => {
                const parsed = Papa.parse(text, {
                    header: true,
                    dynamicTyping: false,
                    skipEmptyLines: true,
                })
                const validData = parsed.data.filter(row =>
                    row['Patient ID'] &&
                    row['Patient ID'].toString().trim() !== '' &&
                    row['Patient Name'] &&
                    row['Patient Name'].toString().trim() !== ''
                )
                setData(validData)
                setLoading(false)
            })
            .catch((err) => {
                console.error('Failed to load fundraising CSV', err)
                setLoading(false)
            })
    }, [])

    const generateImagePaths = (folderName, count) => {
        const paths = [];
        const base_path = `/dukebox_images/${folderName}`;
        for (let i = 1; i <= count; i++) {
            const number = i.toString().padStart(2, '0');
            paths.push(`${base_path}/${number}.webp`);
        }
        return paths;
    };

    // Image galleries
    const galleries = {
        chapel: {
            title: "2025 Chapati Party - Community Celebration",
            images: generateImagePaths('2025-chapati-party', 21)
        },
        training: {
            title: "Bwendero Newborn Screening Training - June 2025",
            images: generateImagePaths('bwendero-nbs-training-june-2025', 17)
        },
        workshop: {
            title: "Delphi Survey Workshop - Research in Action",
            images: generateImagePaths('delphi-survey-workshop', 34)
        },
        goodbye: {
            title: "Goodbye Party at Dreamland - Celebrating Together",
            images: generateImagePaths('goodbye-party-at-dreamland', 23)
        },
        group: {
            title: "Team Photos - Our Community",
            images: generateImagePaths('group-photos', 22)
        },
        history: {
            title: "Joel & Karrie - A Decade of Partnership",
            images: generateImagePaths('joel-karrie-old-photos', 13)
        },
        skills: {
            title: "Skills Training - Bead Making for Economic Empowerment",
            images: generateImagePaths('skills-training-bead-making-khciv-sickle-cell', 2)
        }
    }

    // Initialize carousel states
    useEffect(() => {
        const initial = {}
        Object.keys(galleries).forEach(key => {
            initial[key] = 0
        })
        setCurrentCarousel(initial)
    }, [])

    // Intersection Observer for lazy loading galleries
    useEffect(() => {
        const observers = {}
        Object.keys(galleries).forEach(key => {
            if (galleryRefs.current[key]) {
                observers[key] = new IntersectionObserver(
                    ([entry]) => {
                        if (entry.isIntersecting) {
                            setVisibleGalleries(prev => new Set([...prev, key]))
                        }
                    },
                    { rootMargin: '300px' } // Load 300px before visible
                )
                observers[key].observe(galleryRefs.current[key])
            }
        })

        return () => {
            Object.values(observers).forEach(observer => observer.disconnect())
        }
    }, [galleries])

    const nextImage = (galleryKey) => {
        setCurrentCarousel(prev => ({
            ...prev,
            [galleryKey]: (prev[galleryKey] + 1) % galleries[galleryKey].images.length
        }))
    }

    const prevImage = (galleryKey) => {
        setCurrentCarousel(prev => ({
            ...prev,
            [galleryKey]: prev[galleryKey] === 0 ? galleries[galleryKey].images.length - 1 : prev[galleryKey] - 1
        }))
    }

    // Parse amounts
    const parseAmount = (amount) => {
        if (!amount || amount === '') return 0
        if (typeof amount === 'number') return amount
        if (typeof amount === 'string') {
            const cleaned = amount.toString().replace(/[,"]/g, '').trim()
            const parsed = parseInt(cleaned) || 0
            return parsed
        }
        return 0
    }



    // Transportation Analysis

    const transportationAnalysis = useMemo(() => {
        if (data.length === 0) return []
        const modes = {}

        data.forEach(row => {
            const mode = row['Mode of Transport'] || 'Unknown'
            const cost = parseAmount(row['Transport Cost (ugx) round-trip']) || 0
            const time = parseAmount(row['Travel Time (round-trip, minutes)']) || 0

            if (!modes[mode]) {
                modes[mode] = {
                    mode,
                    patients: 0,
                    totalCost: 0,
                    totalTime: 0
                }
            }
            modes[mode].patients += 1
            modes[mode].totalCost += cost
            modes[mode].totalTime += time
        })

        return Object.values(modes).map(mode => ({
            ...mode,
            avgCost: mode.patients > 0 ? Math.round(mode.totalCost / mode.patients) : 0,
            avgTime: mode.patients > 0 ? Math.round(mode.totalTime / mode.patients) : 0,
        })).sort((a, b) => b.patients - a.patients).slice(0, 6)

    }, [data])


    // Pills Distribution

    const pillsAnalysis = useMemo(() => {

        if (data.length === 0) return []
        const sources = {}

        data.forEach(row => {
            const source = row.Source?.trim() || 'Unknown'
            const pills = parseAmount(row['Pills Purchased']) || 0

            if (!sources[source]) {
                sources[source] = {
                    name: source,
                    pills: 0
                }
            }
            sources[source].pills += pills
        })

        return Object.values(sources).filter(s => s.pills > 0)
    }, [data])




    const brandColors = {
        darkTeal: '#478c7b',
        lightTeal: '#84b9b6',
        gold: '#c3a86b',
        bg: '#f4f9f9'
    }

    const COLORS = [brandColors.darkTeal, brandColors.gold, brandColors.lightTeal, '#2d5e52', '#e0cfa0', '#a3d9d6']


    const collaborators = [
        {
            id: 'duke',
            name: 'Duke University',
            sub: 'School of Medicine & Global Health Institute',
            people: 'Kearsley Stewart, Charmaine Royal, Nirmish Shah, Stephanie Ibemere',
            logo: '/img/duke_logo.png'
        },
        {
            id: 'makerere',
            name: 'Makerere University',
            sub: 'Mulago National Referral Hospital',
            people: 'Deogratias Munube',
            logo: '/img/makerere_logo.png'
        },
        {
            id: 'kalangala',
            name: 'Kalangala Health Center IV',
            sub: 'Local Clinical Leadership',
            people: 'Joel Kibonwabake, Clinic Director',
            logo: '/img/health_center_logo.png'
        },
        {
            id: 'kunihira',
            name: 'Kunihira Sickle Cell Org',
            sub: 'Local Community NGO',
            people: 'Grassroots support for patients and families',
            logo: '/img/kushco_logo.png'
        }
    ]


    const scrollToDonate = () => {

        document.getElementById('donate-section')?.scrollIntoView({ behavior: 'smooth' })

    }



    if (loading) {

        return (

            <div className="min-h-screen flex items-center justify-center bg-gray-50">

                <div className="text-center">

                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent mx-auto mb-4"></div>

                    <p className="text-gray-600">Loading...</p>

                </div>

            </div>

        )

    }

    return (

        <div className="min-h-screen bg-white">

            {/* Sticky Donate Button */}

            <button
                onClick={() => window.open('/donate', '_blank')}
                className="fixed bottom-8 right-8 bg-[#c3a86b] hover:bg-[#b0955b] text-white px-8 py-4 rounded-full shadow-2xl z-40 font-bold text-lg transition-all duration-200 hover:scale-105 flex items-center gap-2 group"
            >
                <div className="bg-white/20 p-1 rounded-full group-hover:rotate-12 transition-transform">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                </div>
                Donate Now
            </button>


            {/* Hero Section */}
            {/* NEW: Spacer div to push content down. Matches header height. */}
            <div className={`transition-all duration-500 ease-in-out ${isScrolled ? 'h-24' : 'h-[28rem]'}`}></div>

            {/* NEW: Sticky Header */}
            <header 
                className={`fixed top-0 left-0 right-0 z-30 flex flex-col justify-center transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] shadow-lg
                ${isScrolled 
                    ? 'bg-[#478c7b] h-20 rounded-none' 
                    : 'bg-gradient-to-br from-[#478c7b] via-[#478c7b] to-[#2d5c51] h-[28rem] rounded-br-[80px]' 
                }`}
            >
                <div className="max-w-7xl mx-auto w-full px-6 flex items-center justify-between h-full">
                    
                    {/* LEFT SIDE: Logo & Titles */}
                    <div className="flex items-center gap-6">
                        {/* Logo: Scales down on scroll */}
                        <div className={`relative transition-all duration-500 ${isScrolled ? 'w-10 h-10' : 'w-24 h-24 sm:w-32 sm:h-32'}`}>
                           <img 
                                src="/logo.svg" 
                                alt="Sickle Cell Clinic Logo" 
                                className="w-full h-full object-contain filter drop-shadow-md"
                           />
                        </div>

                        {/* Titles */}
                        <div className="flex flex-col justify-center">
                            <h1 className={`font-bold text-white leading-none transition-all duration-500 ${isScrolled ? 'text-2xl' : 'text-4xl sm:text-6xl mb-2'}`}>
                                Sickle Cell Clinic
                            </h1>
                            
                            {/* Subtitle: Fades out on scroll */}
                            <div className={`overflow-hidden transition-all duration-500 ${isScrolled ? 'max-h-0 opacity-0' : 'max-h-20 opacity-100'}`}>
                                <p className="text-[#c3a86b] text-lg sm:text-2xl font-medium tracking-wide">
                                    Kalangala, Uganda
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT SIDE: Partner Flags/Logos */}
                    <div className={`flex items-center gap-4 sm:gap-6 transition-all duration-500 ${isScrolled ? 'opacity-0 translate-x-10 pointer-events-none absolute right-0' : 'opacity-100 translate-x-0'}`}>
                        <div className="hidden sm:block w-px h-16 bg-white/20"></div>
                        <div className="flex flex-col sm:flex-row items-center gap-4">
                            <img 
                                src="https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Flag_of_Uganda.svg/320px-Flag_of_Uganda.svg.png" 
                                alt="Uganda" 
                                className="h-8 sm:h-12 rounded shadow-sm border border-white/10" 
                            />
                            <div className="flex gap-3 bg-white/10 p-2 rounded-lg backdrop-blur-sm">
                                <img src="/img/duke_logo.png" alt="Duke" className="h-8 sm:h-10 object-contain" />
                                <div className="w-px h-8 sm:h-10 bg-white/20"></div>
                                <img src="/img/unc_logo.png" alt="UNC" className="h-8 sm:h-10 object-contain" />
                            </div>
                        </div>
                    </div>
                </div>
            </header>


            {/* Task 3: Floating 3-Window Section (Crisis, Sickle Cell, Fieldsite) */}
            <div className="relative bg-gray-50 py-24 overflow-hidden">
                

                <div className="max-w-7xl mx-auto px-4 relative z-10">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

                        {/* Window 1: The Crisis We Face */}
                        <div className="group bg-white rounded-3xl p-8 shadow-xl border-t-4 border-[#c3a86b] transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl h-full flex flex-col">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-3 bg-red-50 rounded-full">
                                    <svg className="w-8 h-8 text-[#c3a86b]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                </div>
                                <h3 className="text-2xl font-bold text-gray-800">The Crisis We Face</h3>
                            </div>
                            
                            <div className="space-y-6 flex-grow">
                                <div className="flex items-start gap-4">
                                    <span className="text-4xl font-bold text-[#c3a86b] leading-none">80%</span>
                                    <p className="text-gray-600 text-sm leading-relaxed">
                                        Mortality rate by age 5 for children born with SCD in Uganda without treatment.
                                    </p>
                                </div>
                                <hr className="border-gray-100" />
                                <div className="flex items-start gap-4">
                                    <span className="text-4xl font-bold text-[#84b9b6] leading-none">20k</span>
                                    <p className="text-gray-600 text-sm leading-relaxed">
                                        Babies born with SCD annually in Uganda (4th highest globally).
                                    </p>
                                </div>
                                <hr className="border-gray-100" />
                                <div className="bg-gray-50 p-4 rounded-xl">
                                    <p className="text-gray-700 italic text-sm">
                                        "A growing global health crisis expecting to rise to 450,000 births by 2050."
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Window 2: Sickle Cell (Centerpiece) */}
                        <div className="group bg-white rounded-3xl p-8 shadow-xl border-t-4 border-[#478c7b] transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl lg:-mt-6 lg:mb-6 relative z-20">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-3 bg-emerald-50 rounded-full">
                                    <svg className="w-8 h-8 text-[#478c7b]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                                    </svg>
                                </div>
                                <h3 className="text-2xl font-bold text-gray-800">Sickle Cell Disease</h3>
                            </div>

                            <p className="text-gray-600 mb-6 leading-relaxed">
                                An inherited blood disorder causing red blood cells to become misshapen, leading to painful vaso-occlusive episodes, organ damage, and premature mortality.
                            </p>

                            {/* Wikipedia Preview Card */}
                            <a 
                                href="https://en.wikipedia.org/wiki/Sickle_cell_disease" 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="block bg-gray-50 hover:bg-blue-50 border border-gray-200 rounded-xl overflow-hidden transition-colors group/wiki"
                            >
                                <div className="flex h-32">
                                    <div className="w-1/3 bg-gray-200">
                                        {/* Placeholder for RBC image since we are staying lightweight */}
                                        <img 
                                            src="https://upload.wikimedia.org/wikipedia/commons/thumb/a/ac/Sickle_cell_disease_%28SCD%29.jpg/640px-Sickle_cell_disease_%28SCD%29.jpg" 
                                            alt="SCD Illustration" 
                                            className="w-full h-full object-cover mix-blend-multiply"
                                        />
                                    </div>
                                    <div className="w-2/3 p-4 flex flex-col justify-between">
                                        <div>
                                            <h4 className="font-serif font-bold text-gray-900 group-hover/wiki:underline decoration-[#478c7b]">Sickle cell disease</h4>
                                            <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                                                A group of blood disorders typically inherited from a person's parents. The most common type is known as sickle cell anaemia.
                                            </p>
                                        </div>
                                        <div className="flex items-center text-xs text-gray-400 mt-2">
                                            <img src="https://upload.wikimedia.org/wikipedia/commons/6/63/Wikipedia-logo.png" className="w-4 h-4 mr-1 opacity-50" alt="Wiki" />
                                            en.wikipedia.org
                                        </div>
                                    </div>
                                </div>
                            </a>
                        </div>

                        {/* Window 3: Our Unique Fieldsite */}
                        <div className="group bg-white rounded-3xl p-8 shadow-xl border-t-4 border-[#84b9b6] transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl h-full flex flex-col">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-3 bg-blue-50 rounded-full">
                                    <svg className="w-8 h-8 text-[#84b9b6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <h3 className="text-2xl font-bold text-gray-800">Our Unique Fieldsite</h3>
                            </div>

                            <div className="mb-6 space-y-3">
                                <div className="flex items-start text-sm text-gray-600">
                                    <span className="font-bold text-[#478c7b] w-24 flex-shrink-0">Location:</span>
                                    <span>Kalangala District (84 Islands)</span>
                                </div>
                                <div className="flex items-start text-sm text-gray-600">
                                    <span className="font-bold text-[#478c7b] w-24 flex-shrink-0">Challenge:</span>
                                    <span>Highest HIV rates & Water transport barriers</span>
                                </div>
                                <div className="flex items-start text-sm text-gray-600">
                                    <span className="font-bold text-[#478c7b] w-24 flex-shrink-0">Status:</span>
                                    <span>"Hard to Reach" & "Hard to Stay"</span>
                                </div>
                            </div>

                            {/* Integrated Map - Kalangala */}
                            <div className="rounded-xl overflow-hidden border border-gray-200 shadow-inner h-48 relative">
                                <iframe 
                                    width="100%" 
                                    height="100%" 
                                    frameBorder="0" 
                                    scrolling="no" 
                                    marginHeight="0" 
                                    marginWidth="0" 
                                    src="https://www.openstreetmap.org/export/embed.html?bbox=32.08389282226563%2C-0.5186082464735168%2C32.41760253906251%2C-0.2073685419028911&amp;layer=mapnik" 
                                    style={{ border: 0 }}
                                    title="Kalangala Map"
                                    className="grayscale hover:grayscale-0 transition-all duration-700"
                                ></iframe>
                                <div className="absolute bottom-2 right-2 bg-white/90 px-2 py-1 rounded text-[10px] text-gray-500 shadow-sm pointer-events-none">
                                    Lake Victoria, Uganda
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>

            {/* Task 4: Interactive Gallery Selector */}
            <div className="py-24 bg-white relative overflow-hidden">
                
                <div className="max-w-5xl mx-auto px-4 relative z-10">

                    {/* 1. Header & Dropdown Selector */}
                    <div className="flex justify-center mb-8 relative">
                        <div className="relative inline-block text-left z-30">
                            <div 
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                className="cursor-pointer bg-white border-2 border-[#84b9b6] px-6 py-3 rounded-2xl shadow-sm hover:shadow-md transition-all flex items-center gap-4 group"
                            >
                                <h3 className="text-2xl font-bold text-[#478c7b] min-w-[200px] text-center select-none">
                                    {galleries[activeGalleryKey]?.title}
                                </h3>
                                <div className="bg-[#f4f9f9] p-2 rounded-lg group-hover:bg-[#e0efff] transition-colors">
                                    <svg className="w-6 h-6 text-[#478c7b]" fill="currentColor" viewBox="0 0 24 24">
                                        <circle cx="5" cy="12" r="2" />
                                        <circle cx="12" cy="12" r="2" />
                                        <circle cx="19" cy="12" r="2" />
                                    </svg>
                                </div>
                            </div>

                            {/* Dropdown Menu */}
                            {isDropdownOpen && (
                                <div className="absolute top-full left-0 mt-2 w-full min-w-[300px] bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden animate-fade-in-down">
                                    {Object.entries(galleries).map(([key, gallery]) => (
                                        <button
                                            key={key}
                                            onClick={() => {
                                                setActiveGalleryKey(key);
                                                setIsDropdownOpen(false);
                                            }}
                                            className={`w-full text-left px-6 py-4 hover:bg-[#f4f9f9] transition-colors border-b border-gray-50 last:border-0
                                                ${activeGalleryKey === key ? 'text-[#c3a86b] font-bold bg-[#fcfbf7]' : 'text-gray-600'}`}
                                        >
                                            {gallery.title}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 2. Image Viewer Area */}
                    <div className="flex items-center justify-center gap-4 md:gap-12">
                        
                        {/* Left Arrow (Outside) */}
                        <button 
                            onClick={() => prevImage(activeGalleryKey)}
                            className="p-4 rounded-full text-[#478c7b] hover:bg-[#f4f9f9] hover:scale-110 transition-all focus:outline-none"
                        >
                            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>

                        {/* Main Frame */}
                        <div className="relative w-full max-w-3xl aspect-[4/3] md:aspect-video bg-gray-50 rounded-3xl overflow-hidden shadow-2xl border-4 border-white ring-1 ring-gray-100 group">
                            
                            {/* Smart Background: Blurs the current image to fill empty space */}
                            <div className="absolute inset-0 z-0">
                                {galleries[activeGalleryKey]?.images[currentCarousel[activeGalleryKey] || 0] && (
                                    <img 
                                        src={galleries[activeGalleryKey].images[currentCarousel[activeGalleryKey] || 0]}
                                        className="w-full h-full object-cover blur-2xl opacity-40 scale-110"
                                        alt="background blur"
                                    />
                                )}
                            </div>

                            {/* The Actual Image */}
                            <div className="absolute inset-0 z-10 p-4 md:p-8 flex items-center justify-center">
                                <img
                                    src={galleries[activeGalleryKey]?.images[currentCarousel[activeGalleryKey] || 0]}
                                    alt="Gallery Display"
                                    className="max-w-full max-h-full object-contain rounded-lg shadow-sm transition-transform duration-500 group-hover:scale-[1.01]"
                                />
                            </div>

                            {/* Counter Pill (Bottom Right inside frame) */}
                            <div className="absolute bottom-4 right-4 z-20 bg-white/80 backdrop-blur-md px-4 py-1 rounded-full text-sm font-bold text-[#478c7b] border border-white/50 shadow-sm">
                                {(currentCarousel[activeGalleryKey] || 0) + 1} / {galleries[activeGalleryKey]?.images.length}
                            </div>
                        </div>

                        {/* Right Arrow (Outside) */}
                        <button 
                            onClick={() => nextImage(activeGalleryKey)}
                            className="p-4 rounded-full text-[#478c7b] hover:bg-[#f4f9f9] hover:scale-110 transition-all focus:outline-none"
                        >
                            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    </div>

                </div>
            </div>




            {/* Task 5: Combined Impact & Collaborators Section */}
            
            <div className="py-20 relative overflow-hidden" style={{ backgroundColor: brandColors.bg }}>
                {/* Decorative Background Elements */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-5">
                    <svg className="absolute -left-20 top-20 w-96 h-96 text-[#478c7b]" fill="currentColor" viewBox="0 0 200 200">
                        <path d="M45.7,18.8c-9.8,5.1-18.2,14.6-21.6,25.8S26.6,71,36,80.5c6.3,6.3,14.5,10.2,23.1,11.5c1.4,0.2,2.8,0.3,4.2,0.3 c13.6,0,26.4-5.3,36-14.9c19.9-19.9,19.9-52.1,0-72C80.5-13.6,48.3-13.6,28.4,6.3C34.8,9.7,40.7,13.8,45.7,18.8z" />
                    </svg>
                    <div className="absolute right-0 bottom-0 w-64 h-64 rounded-full border-4 border-[#84b9b6] translate-x-1/2 translate-y-1/2"></div>
                </div>

                <div className="max-w-7xl mx-auto px-4 relative z-10">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-start">

                        {/* LEFT COLUMN: Impact by the Numbers */}
                        <div className="lg:col-span-5 space-y-8">
                            <div className="text-left mb-8">
                                <span className="inline-block py-1 px-3 rounded-full text-xs font-bold tracking-wider uppercase mb-2" 
                                      style={{ backgroundColor: `${brandColors.lightTeal}20`, color: brandColors.darkTeal }}>
                                    Data Analysis
                                </span>
                                <h2 className="text-4xl font-serif font-bold" style={{ color: brandColors.darkTeal }}>
                                    Impact by the Numbers
                                </h2>
                            </div>

                            {/* Chart 1: Transportation */}
                            <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-[#84b9b6]/30 hover:shadow-md transition-shadow duration-300">
                                <h3 className="text-lg font-bold mb-2 flex items-center" style={{ color: brandColors.darkTeal }}>
                                    <span className="w-2 h-8 rounded-full mr-3" style={{ backgroundColor: brandColors.gold }}></span>
                                    Transportation Barriers
                                </h3>
                                <p className="text-sm text-gray-500 mb-6 pl-5">Average cost and time to reach the clinic.</p>
                                
                                <div className="h-64 w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={transportationAnalysis} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                                            <XAxis 
                                                dataKey="mode" 
                                                axisLine={false} 
                                                tickLine={false} 
                                                tick={{ fill: '#6b7280', fontSize: 10 }}
                                                dy={10}
                                            />
                                            <YAxis 
                                                axisLine={false} 
                                                tickLine={false} 
                                                tick={{ fill: '#6b7280', fontSize: 10 }}
                                            />
                                            <Tooltip 
                                                cursor={{ fill: `${brandColors.lightTeal}10` }}
                                                contentStyle={{ borderRadius: '12px', border: `1px solid ${brandColors.lightTeal}`, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                            />
                                            <Bar dataKey="patients" radius={[4, 4, 0, 0]}>
                                                {transportationAnalysis.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={index % 2 === 0 ? brandColors.darkTeal : brandColors.lightTeal} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Chart 2: Pills */}
                            <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-[#84b9b6]/30 hover:shadow-md transition-shadow duration-300">
                                <h3 className="text-lg font-bold mb-2 flex items-center" style={{ color: brandColors.darkTeal }}>
                                    <span className="w-2 h-8 rounded-full mr-3" style={{ backgroundColor: brandColors.lightTeal }}></span>
                                    Medication Sources
                                </h3>
                                <p className="text-sm text-gray-500 mb-6 pl-5">Distribution of Hydroxyurea purchases.</p>
                                
                                <div className="h-64 w-full flex items-center justify-center">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={pillsAnalysis}
                                                dataKey="pills"
                                                nameKey="name"
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={80}
                                                paddingAngle={5}
                                            >
                                                {pillsAnalysis.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip 
                                                contentStyle={{ borderRadius: '12px', border: `1px solid ${brandColors.lightTeal}` }}
                                            />
                                            <Legend 
                                                verticalAlign="bottom" 
                                                height={36} 
                                                iconType="circle"
                                                formatter={(value) => <span className="text-xs text-gray-600 ml-1">{value}</span>}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>

                        {/* RIGHT COLUMN: Collaborators */}
                        <div className="lg:col-span-7 mt-12 lg:mt-0">
                             <div className="text-right mb-12">
                                <span className="inline-block py-1 px-3 rounded-full text-xs font-bold tracking-wider uppercase mb-2" 
                                      style={{ backgroundColor: `${brandColors.gold}30`, color: '#8c7335' }}>
                                    Partnership
                                </span>
                                <h2 className="text-4xl font-serif font-bold" style={{ color: brandColors.darkTeal }}>
                                    Research Collaborators
                                </h2>
                            </div>

                            <div className="space-y-6 relative">
                                {/* Central connecting line (only visible on desktop) */}
                                <div className="absolute left-1/2 top-4 bottom-4 w-px bg-gray-200 hidden md:block -translate-x-1/2"></div>

                                {collaborators.map((collab, index) => {
                                    const isEven = index % 2 === 0;
                                    
                                    return (
                                        <div key={collab.id} className={`flex flex-col md:flex-row items-center gap-6 md:gap-12 relative group`}>
                                            
                                            {/* Connector Dot */}
                                            <div className="hidden md:block absolute left-1/2 top-1/2 w-4 h-4 rounded-full border-4 border-white shadow-sm z-10 -translate-x-1/2 -translate-y-1/2 transition-colors duration-300 group-hover:bg-[#c3a86b]" style={{ backgroundColor: brandColors.lightTeal }}></div>

                                            {/* Left Side (Text if Even, Logo if Odd) */}
                                            <div className={`flex-1 w-full md:w-auto ${isEven ? 'text-center md:text-right order-2 md:order-1' : 'order-1 md:order-2 flex justify-center md:justify-start'}`}>
                                                {isEven ? (
                                                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-transparent group-hover:border-[#84b9b6] transition-all duration-300">
                                                        <h3 className="text-xl font-bold mb-1" style={{ color: brandColors.darkTeal }}>{collab.name}</h3>
                                                        <p className="text-sm font-semibold mb-2" style={{ color: brandColors.gold }}>{collab.sub}</p>
                                                        <p className="text-sm text-gray-600 leading-relaxed">{collab.people}</p>
                                                    </div>
                                                ) : (
                                                    <div className="w-32 h-32 p-4 bg-white rounded-full shadow-lg flex items-center justify-center border-4 border-[#f0f7f6] group-hover:scale-110 transition-transform duration-300">
                                                        <img src={collab.logo} alt={collab.name} className="max-w-full max-h-full object-contain" />
                                                    </div>
                                                )}
                                            </div>

                                            {/* Right Side (Logo if Even, Text if Odd) */}
                                            <div className={`flex-1 w-full md:w-auto ${isEven ? 'order-1 md:order-2 flex justify-center md:justify-start' : 'text-center md:text-left order-2 md:order-1'}`}>
                                                {isEven ? (
                                                     <div className="w-32 h-32 p-4 bg-white rounded-full shadow-lg flex items-center justify-center border-4 border-[#f0f7f6] group-hover:scale-110 transition-transform duration-300">
                                                        <img src={collab.logo} alt={collab.name} className="max-w-full max-h-full object-contain" />
                                                    </div>
                                                ) : (
                                                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-transparent group-hover:border-[#84b9b6] transition-all duration-300">
                                                        <h3 className="text-xl font-bold mb-1" style={{ color: brandColors.darkTeal }}>{collab.name}</h3>
                                                        <p className="text-sm font-semibold mb-2" style={{ color: brandColors.gold }}>{collab.sub}</p>
                                                        <p className="text-sm text-gray-600 leading-relaxed">{collab.people}</p>
                                                    </div>
                                                )}
                                            </div>

                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </div>


            {/* Project Goals */}

            <div className="bg-gradient-to-br from-blue-900 to-emerald-900 text-white py-16">

                <div className="max-w-6xl mx-auto px-4">

                    <h2 className="text-4xl font-bold mb-8 text-center">Project Goals 2025-2030</h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">

                            <h3 className="text-xl font-bold mb-3 flex items-center">

                                <svg className="w-6 h-6 mr-2 text-emerald-300" fill="currentColor" viewBox="0 0 20 20">

                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />

                                </svg>

                                Expand Laboratory Testing

                            </h3>

                            <p className="text-blue-100">Enhance laboratory testing capability and staff skills for better diagnostics</p>

                        </div>

                        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">

                            <h3 className="text-xl font-bold mb-3 flex items-center">

                                <svg className="w-6 h-6 mr-2 text-emerald-300" fill="currentColor" viewBox="0 0 20 20">

                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />

                                </svg>

                                Increase Patient Access

                            </h3>

                            <p className="text-blue-100">Expand patient access to clinical services across the islands</p>

                        </div>

                        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">

                            <h3 className="text-xl font-bold mb-3 flex items-center">

                                <svg className="w-6 h-6 mr-2 text-emerald-300" fill="currentColor" viewBox="0 0 20 20">

                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />

                                </svg>

                                Develop m-Health Program

                            </h3>

                            <p className="text-blue-100">Phone-based and digital outreach clinical services for remote patients</p>

                        </div>

                        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">

                            <h3 className="text-xl font-bold mb-3 flex items-center">

                                <svg className="w-6 h-6 mr-2 text-emerald-300" fill="currentColor" viewBox="0 0 20 20">

                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />

                                </svg>

                                Scale Newborn Screening

                            </h3>

                            <p className="text-blue-100">Increase screening at clinic and in communities for home births</p>

                        </div>

                        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">

                            <h3 className="text-xl font-bold mb-3 flex items-center">

                                <svg className="w-6 h-6 mr-2 text-emerald-300" fill="currentColor" viewBox="0 0 20 20">

                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />

                                </svg>

                                Train Healthcare Workers

                            </h3>

                            <p className="text-blue-100">Prenatal SCD education and counseling strategies to support families</p>

                        </div>

                        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">

                            <h3 className="text-xl font-bold mb-3 flex items-center">

                                <svg className="w-6 h-6 mr-2 text-emerald-300" fill="currentColor" viewBox="0 0 20 20">

                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />

                                </svg>

                                Support Women with SCD

                            </h3>

                            <p className="text-blue-100">SCD-specific counseling, healthcare support, and economic opportunities</p>

                        </div>

                    </div>

                </div>

            </div>


            {/* Urgent Fundraising Goals */}

            <div className="bg-gradient-to-br from-red-600 to-orange-600 text-white py-16">

                <div className="max-w-6xl mx-auto px-4">

                    <div className="text-center mb-8">

                        <span className="inline-block bg-white text-red-600 px-4 py-2 rounded-full font-bold text-sm mb-4">URGENT</span>

                        <h2 className="text-4xl font-bold mb-4">Immediate Funding Needed</h2>

                        <p className="text-xl text-red-100">Research funds for hydroxyurea end March 15, 2025</p>

                    </div>


                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 border border-white/20 text-center">

                            <h3 className="text-5xl font-bold mb-2">$125</h3>

                            <p className="text-lg mb-2">One Week of Treatment</p>

                            <p className="text-sm text-red-100">Supplies hydroxyurea for all current patients for one week</p>

                        </div>

                        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 border border-white/20 text-center">

                            <h3 className="text-5xl font-bold mb-2">$500</h3>

                            <p className="text-lg mb-2">One Month of Treatment</p>

                            <p className="text-sm text-red-100">Supplies hydroxyurea for all current patients for one month</p>

                        </div>

                        <div className="bg-white/20 backdrop-blur-sm rounded-xl p-8 border-2 border-white/40 text-center">

                            <h3 className="text-5xl font-bold mb-2">$9,630</h3>

                            <p className="text-lg mb-2">Full Year of Treatment</p>

                            <p className="text-sm text-red-100">Covers all patients for 2025, including new enrollments</p>

                        </div>

                    </div>



                    <div className="mt-8 bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">

                        <h3 className="text-2xl font-bold mb-3">Why Hydroxyurea Matters</h3>

                        <p className="text-lg text-red-100">

                            Hydroxyurea is a <strong>life-saving medication</strong> for sickle cell patients. It reduces painful crises, prevents organ damage, and dramatically improves survival rates. Since 2022, Duke-sponsored research has covered the cost for 90 patients. Without continued support, these patients will lose access to this essential treatment.

                        </p>

                    </div>

                </div>

            </div>



            {/* Long-term Fundraising Goals */}

            <div className="bg-white py-16">

                <div className="max-w-6xl mx-auto px-4">

                    <h2 className="text-4xl font-bold text-gray-900 mb-8 text-center">Long-term Investment Goals</h2>


                    <div className="space-y-6">

                        <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-8 border-2 border-blue-300">

                            <div className="flex items-center justify-between flex-wrap gap-4">

                                <div>

                                    <h3 className="text-2xl font-bold text-blue-900 mb-2">Research: Liver & Kidney Function Study</h3>

                                    <p className="text-gray-700">Fund a Duke-KHCIV lab study of patient liver and kidney function for two years, improving long-term health outcomes</p>

                                </div>

                                <div className="text-right">

                                    <p className="text-4xl font-bold text-blue-600">$12,000</p>

                                    <p className="text-sm text-gray-600">2-year study</p>

                                </div>

                            </div>

                        </div>



                        <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 rounded-xl p-8 border-2 border-emerald-300">

                            <div className="flex items-center justify-between flex-wrap gap-4">

                                <div>

                                    <h3 className="text-2xl font-bold text-emerald-900 mb-2">Temporary Clinic Space</h3>

                                    <p className="text-gray-700">Build a 2-room tent dedicated to a waiting room and treatment room for sickle cell patients</p>

                                    <p className="text-sm text-gray-600 mt-2">Currently the clinic meets every Tuesday in the Ophthalmology clinic</p>

                                </div>

                                <div className="text-right">

                                    <p className="text-4xl font-bold text-emerald-600">$5,000</p>

                                    <p className="text-sm text-gray-600">Dedicated space</p>

                                </div>

                            </div>

                        </div>



                        <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl p-8 border-2 border-purple-300">

                            <div className="flex items-center justify-between flex-wrap gap-4">

                                <div>

                                    <h3 className="text-2xl font-bold text-purple-900 mb-2">Permanent Sickle Cell Clinic Building</h3>

                                    <p className="text-gray-700">Build the foundation for a new sickle cell clinic building at KHCIV</p>

                                    <p className="text-sm text-gray-600 mt-2">Land has already been allocated by the health center</p>

                                </div>

                                <div className="text-right">

                                    <p className="text-4xl font-bold text-purple-600">$20,000</p>

                                    <p className="text-sm text-gray-600">Foundation</p>

                                </div>

                            </div>

                        </div>

                    </div>

                </div>

            </div>


            {/* Media & Resources */}

            <div className="bg-gray-100 py-16">

                <div className="max-w-6xl mx-auto px-4">

                    <h2 className="text-4xl font-bold text-gray-900 mb-8 text-center">Media & Resources</h2>


                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">

                        <div className="bg-white rounded-lg shadow-lg p-6">

                            <h3 className="text-xl font-bold text-gray-900 mb-4">Featured Media</h3>

                            <ul className="space-y-3">

                                <li>

                                    <a href="https://www.newvision.co.ug/category/health/kalangala-worried-about-increasing-sickle-cel-NV_175593" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">

                                        Uganda's leading newspaper, New Vision, Nov 2023

                                    </a>

                                </li>

                                <li>

                                    <a href="https://www.youtube.com/watch?v=DqatLgSEUUw&t=2s" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">

                                        23-minute VIDEO about our sickle cell clinic in Kalangala, Uganda

                                    </a>

                                </li>

                            </ul>

                        </div>



                        <div className="bg-white rounded-lg shadow-lg p-6">

                            <h3 className="text-xl font-bold text-gray-900 mb-4">Social Media</h3>

                            <ul className="space-y-3">

                                <li>

                                    <a href="https://www.instagram.com/kunihirascorg/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">

                                        Kunihira NGO Instagram

                                    </a>

                                </li>

                                <li>

                                    <a href="https://x.com/KunihiraSCO" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">

                                        Kunihira NGO X (Twitter)

                                    </a>

                                </li>

                                <li>

                                    <a href="https://kuhsco.org/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">

                                        Kunihira webpage (under construction)

                                    </a>

                                </li>

                                <li>

                                    <a href="https://www.youtube.com/@joel1983" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">

                                        YouTube: "My Health Talks" by Joel Kibonwabake

                                    </a>

                                </li>

                            </ul>

                        </div>

                    </div>



                    <div className="bg-white rounded-lg shadow-lg p-6">

                        <h3 className="text-xl font-bold text-gray-900 mb-4">Duke Global Health Institute - News</h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                            <ul className="space-y-2 text-sm">

                                <li><a href="https://globalhealth.duke.edu/news/students-prepare-display-research-skills-showcase" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">2024: Maddie Kitts - Scaling up newborn screening</a></li>

                                <li><a href="https://globalhealth.duke.edu/news/uganda-road-treating-sickle-cell-disease-sometimes-isnt-road" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">2024: Daniel Lee - Traveling by water to reach patients</a></li>

                                <li><a href="https://globalhealth.duke.edu/news/dance-global-health-message" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">2022: Music, dance and drama collaboration</a></li>

                                <li><a href="https://globalhealth.duke.edu/news/notes-field-how-we-travel" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">2022: MSGH and undergraduate research fieldwork</a></li>

                            </ul>

                            <ul className="space-y-2 text-sm">

                                <li><a href="https://globalhealth.duke.edu/news/no-field-no-problem" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">2021: Dorothy Nam - Thesis research during Covid</a></li>

                                <li><a href="https://globalhealth.duke.edu/news/bringing-sickle-cell-awareness-small-island" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">2021: Undergraduate research team during Covid</a></li>
                                <li><a href="https://globalhealth.duke.edu/news/big-challenge-comes-small-island" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">2020: COVID-19 quarantine by Joel Kibonwabake</a></li>
                            </ul>
                        </div>
                    </div>

                    <div className="mt-6 bg-white rounded-lg shadow-lg p-6">
                        <h3 className="text-xl font-bold text-gray-900 mb-4">Conference Presentations & Posters</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <ul className="space-y-2">
                                <li><a href="https://globalhealth.duke.edu/student-showcases/multilevel-analysis-barriers-hydroxyurea-effectiveness-and-recurrent-vaso" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">2025: Julius Muchangi - Barriers to Hydroxyurea Effectiveness</a></li>
                                <li><a href="https://duke.box.com/s/xaavyzqnb7mltfhej4ehoq61fxbo7s7n" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">2025: Nigeria - Rapid SCD testing at Global Congress</a></li>
                                <li><a href="https://duke.box.com/s/jmphej63zgup35kdphtgdrentz7i43kd" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">2025: Daniel Lee - Hydroxyurea Adherence</a></li>
                                <li><a href="https://duke.box.com/s/96t365aes2bfu0rbrc02xgev1n4rbgjd" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">2025: Maddie Kitts - Scale-up SCD Newborn Screening</a></li>
                            </ul>
                            <ul className="space-y-2">
                                <li><a href="https://globalhealth.duke.edu/student-showcases/creating-accessible-educational-tools-increase-community-awareness-sickle-cell" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">2022: Bailey Griffen - Educational Tools</a></li>
                                <li><a href="https://globalhealth.duke.edu/student-showcases/assessing-arts-based-vs-school-based-community-engaged-sickle-cell-disease" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">2021: Dorothy Nam - Arts-Based Tools</a></li>
                                <li><a href="https://cugh.confex.com/cugh/2021/poster/eposterview.cgi?eposterid=724" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">2021: Kristen Jones - SCD Genetics Research (CUGH)</a></li>
                                <li><a href="https://ghic.uniteforsight.org/posters-2021" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">2021: Kristen Jones - SCD Genetics (Unite for Sight)</a></li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>

            {/* Contact Section */}
            <div className="bg-gray-900 text-white py-12">
                <div className="max-w-4xl mx-auto px-4 text-center">
                    <h2 className="text-3xl font-bold mb-6">Contact Us</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <h3 className="font-bold text-lg mb-2">Musawo Joel Kibonwabake</h3>
                            <p className="text-gray-300">KHCIV Sickle Cell Clinic Director</p>
                            <p className="text-blue-400">kibonwabake2008@gmail.com</p>
                            <p className="text-gray-300">WhatsApp: +256-772-921-610</p>
                        </div>
                        <div>
                            <h3 className="font-bold text-lg mb-2">Professor Kearsley Stewart</h3>
                            <p className="text-gray-300">Duke Global Health Institute</p>
                            <p className="text-blue-400">k.stewart@duke.edu</p>
                            <p className="text-gray-300">WhatsApp: +1 202-340-8818</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )

}



export default Fundraising

