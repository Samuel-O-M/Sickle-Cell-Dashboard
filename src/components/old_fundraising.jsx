// DO NOT MODIFY THIS FILE. IT IS FOR REFERENCE AND CONTENT. IT SHOULD STAY AS IT IS.

// DO NOT MODIFY THIS FILE. IT IS FOR REFERENCE AND CONTENT. IT SHOULD STAY AS IT IS.


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

    const galleryRefs = useRef({})



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





    // Helper function to generate sequential image paths

    const generateImagePaths = (folderName, count) => {

        const paths = [];

        const base_path = `/dukebox_images/${folderName}`;


        for (let i = 1; i <= count; i++) {

            // Format number as two digits (e.g., 1 -> "01", 12 -> "12")

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



    const COLORS = ['#059669', '#2563eb', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4']



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

                onClick={scrollToDonate}

                className="fixed bottom-8 right-8 bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-4 rounded-full shadow-2xl z-50 font-bold text-lg transition-all duration-200 hover:scale-105 flex items-center gap-2"

            >

                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">

                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />

                </svg>

                Donate Now

            </button>



            {/* Hero Section */}

            <div className="relative bg-gradient-to-br from-blue-900 via-blue-800 to-emerald-900 text-white">

                <div className="absolute inset-0 bg-black opacity-40"></div>

                <div className="relative max-w-7xl mx-auto px-4 py-24 sm:py-32">

                    <div className="text-center">

                        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6 leading-tight">

                            Reducing the Burden of<br />Sickle Cell Disease

                        </h1>

                        <p className="text-2xl sm:text-3xl mb-4 text-blue-100">

                            in a Remote Island Community in Uganda

                        </p>

                        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center items-center">

                            <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Flag_of_Uganda.svg/320px-Flag_of_Uganda.svg.png" alt="Uganda Flag" className="h-16 rounded shadow-lg" />

                            <div className="flex gap-4">

                                <img src="/img/duke_logo.png" alt="Duke" className="h-12" />

                                <img src="/img/unc_logo.png" alt="UNC" className="h-12 bg-white px-2 rounded" />

                            </div>

                        </div>

                    </div>

                </div>

            </div>



            {/* Background Section */}

            <div className="bg-gray-50 py-16">

                <div className="max-w-6xl mx-auto px-4">

                    <h2 className="text-4xl font-bold text-gray-900 mb-8 text-center">The Crisis We Face</h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                        <div className="bg-white rounded-xl shadow-lg p-8 border-l-4 border-red-500">

                            <h3 className="text-6xl font-bold text-red-500 mb-2">80%</h3>

                            <p className="text-xl text-gray-700 font-semibold mb-2">Child Mortality by Age 5</p>

                            <p className="text-gray-600">Children born with SCD in Uganda face devastating mortality rates without treatment.</p>

                        </div>

                        <div className="bg-white rounded-xl shadow-lg p-8 border-l-4 border-blue-500">

                            <h3 className="text-6xl font-bold text-blue-500 mb-2">20,000</h3>

                            <p className="text-xl text-gray-700 font-semibold mb-2">Children Born with SCD Annually</p>

                            <p className="text-gray-600">Uganda has the 4th largest number of sickle cell patients globally.</p>

                        </div>

                        <div className="bg-white rounded-xl shadow-lg p-8 border-l-4 border-emerald-500">

                            <h3 className="text-6xl font-bold text-emerald-500 mb-2">300,000</h3>

                            <p className="text-xl text-gray-700 font-semibold mb-2">Global Infants Born with SCD</p>

                            <p className="text-gray-600">Expected to rise to 450,000 by 2050. This is a growing global health crisis.</p>

                        </div>

                        <div className="bg-white rounded-xl shadow-lg p-8 border-l-4 border-purple-500">

                            <h3 className="text-6xl font-bold text-purple-500 mb-2">4-8</h3>

                            <p className="text-xl text-gray-700 font-semibold mb-2">Hours in Open Canoe</p>

                            <p className="text-gray-600">Many patients travel this long to reach our clinic, enduring cold that triggers pain crises.</p>

                        </div>

                    </div>



                    <div className="mt-12 bg-white rounded-xl shadow-lg p-8">

                        <h3 className="text-2xl font-bold text-gray-900 mb-4">What is Sickle Cell Disease?</h3>

                        <p className="text-lg text-gray-700 mb-4">

                            Sickle cell disease (SCD) is one of the world's most common inherited blood disorders. It is a complex chronic condition causing painful vaso-occlusive episodes, multi-organ damage, and premature mortality.

                        </p>

                        <p className="text-lg text-gray-700">

                            <strong className="text-emerald-600">The disparity is stark:</strong> In Uganda, less than 5,000 children are born with HIV annually, yet almost all survive to age 10 with treatment. Meanwhile, 20,000 children are born with SCD each year, and 80% die by age 5 without intervention. <strong>Newborn and child sickle cell mortality is a key health equity issue in Uganda.</strong>

                        </p>

                    </div>

                </div>

            </div>



            {/* Unique Fieldsite */}

            <div className="bg-white py-16">

                <div className="max-w-6xl mx-auto px-4">

                    <h2 className="text-4xl font-bold text-gray-900 mb-8 text-center">Our Unique Fieldsite</h2>

                    <div className="bg-gradient-to-br from-blue-50 to-emerald-50 rounded-xl shadow-lg p-8 border-2 border-blue-200">

                        <h3 className="text-2xl font-bold text-blue-900 mb-4">Kalangala District</h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                            <div>

                                <ul className="space-y-3 text-lg text-gray-700">

                                    <li className="flex items-start">

                                        <svg className="w-6 h-6 text-blue-600 mr-2 flex-shrink-0 mt-1" fill="currentColor" viewBox="0 0 20 20">

                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />

                                        </svg>

                                        <span><strong>84 islands</strong> in Lake Victoria, 63 habitable</span>

                                    </li>

                                    <li className="flex items-start">

                                        <svg className="w-6 h-6 text-blue-600 mr-2 flex-shrink-0 mt-1" fill="currentColor" viewBox="0 0 20 20">

                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />

                                        </svg>

                                        <span><strong>Highest rates of HIV</strong> in Uganda due to mobile fishing population</span>

                                    </li>

                                    <li className="flex items-start">

                                        <svg className="w-6 h-6 text-blue-600 mr-2 flex-shrink-0 mt-1" fill="currentColor" viewBox="0 0 20 20">

                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />

                                        </svg>

                                        <span><strong>Twice the national average</strong> of sickle cell disease</span>

                                    </li>

                                </ul>

                            </div>

                            <div>

                                <ul className="space-y-3 text-lg text-gray-700">

                                    <li className="flex items-start">

                                        <svg className="w-6 h-6 text-emerald-600 mr-2 flex-shrink-0 mt-1" fill="currentColor" viewBox="0 0 20 20">

                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />

                                        </svg>

                                        <span>Officially designated <strong>"Hard to Reach"</strong> and <strong>"Hard to Stay"</strong></span>

                                    </li>

                                    <li className="flex items-start">

                                        <svg className="w-6 h-6 text-emerald-600 mr-2 flex-shrink-0 mt-1" fill="currentColor" viewBox="0 0 20 20">

                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />

                                        </svg>

                                        <span>Remote location with <strong>high water transportation costs</strong></span>

                                    </li>

                                    <li className="flex items-start">

                                        <svg className="w-6 h-6 text-emerald-600 mr-2 flex-shrink-0 mt-1" fill="currentColor" viewBox="0 0 20 20">

                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />

                                        </svg>

                                        <span>Clinic opened in 2015 with 2 patients, now <strong>100+ enrolled</strong></span>

                                    </li>

                                </ul>

                            </div>

                        </div>

                    </div>

                </div>

            </div>



            {/* Image Carousels Section */}

            <div className="bg-gray-50 py-16">

                <div className="max-w-6xl mx-auto px-4">

                    <h2 className="text-4xl font-bold text-gray-900 mb-12 text-center">Our Story in Pictures</h2>


                    {Object.entries(galleries).map(([key, gallery]) => (

                        <div

                            key={key}

                            className="mb-16"

                            ref={el => galleryRefs.current[key] = el}

                        >

                            <h3 className="text-2xl font-bold text-gray-800 mb-4">{gallery.title}</h3>


                            {visibleGalleries.has(key) ? (

                                <div className="relative bg-white rounded-xl shadow-lg overflow-hidden">

                                    <div className="aspect-video relative bg-gray-100">

                                        {/* Loading indicator */}

                                        {imageLoading[`${key}-${currentCarousel[key] || 0}`] && (

                                            <div className="absolute inset-0 flex items-center justify-center bg-gray-200 z-10">

                                                <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>

                                            </div>

                                        )}


                                        <img

                                            src={gallery.images[currentCarousel[key] || 0]}

                                            alt={`${gallery.title} - Image ${(currentCarousel[key] || 0) + 1}`}

                                            className="w-full h-full object-contain bg-gray-900"

                                            loading="lazy"

                                            onLoadStart={() => setImageLoading(prev => ({ ...prev, [`${key}-${currentCarousel[key] || 0}`]: true }))}

                                            onLoad={() => setImageLoading(prev => ({ ...prev, [`${key}-${currentCarousel[key] || 0}`]: false }))}

                                        />

                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none"></div>

                                        <div className="absolute bottom-4 left-4 right-4 text-white">

                                            <p className="text-sm font-semibold">

                                                {(currentCarousel[key] || 0) + 1} / {gallery.images.length}

                                            </p>

                                        </div>

                                    </div>


                                    {/* Carousel Controls */}

                                    <button

                                        onClick={() => prevImage(key)}

                                        className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-800 rounded-full p-3 shadow-lg transition-all z-20"

                                        aria-label="Previous image"

                                    >

                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">

                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />

                                        </svg>

                                    </button>

                                    <button

                                        onClick={() => nextImage(key)}

                                        className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-800 rounded-full p-3 shadow-lg transition-all z-20"

                                        aria-label="Next image"

                                    >

                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">

                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />

                                        </svg>

                                    </button>



                                    {/* Thumbnail Navigation */}

                                    <div className="p-4 bg-gray-50 overflow-x-auto">

                                        <div className="flex gap-2">

                                            {gallery.images.map((img, idx) => {

                                                // Only load thumbnails within 3 positions of current image

                                                const currentIdx = currentCarousel[key] || 0

                                                const isVisible = Math.abs(currentIdx - idx) <= 3

                                                const isCurrent = currentIdx === idx


                                                return (

                                                    <button

                                                        key={idx}

                                                        onClick={() => setCurrentCarousel(prev => ({ ...prev, [key]: idx }))}

                                                        className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${isCurrent ? 'border-blue-500 scale-110' : 'border-gray-300 opacity-60 hover:opacity-100'

                                                            }`}

                                                        aria-label={`Go to image ${idx + 1}`}

                                                    >

                                                        {isVisible ? (

                                                            <img

                                                                src={img}

                                                                alt={`Thumbnail ${idx + 1}`}

                                                                className="w-full h-full object-cover"

                                                                loading="lazy"

                                                            />

                                                        ) : (

                                                            <div className="w-full h-full bg-gray-200 flex items-center justify-center">

                                                                <span className="text-xs text-gray-400">{idx + 1}</span>

                                                            </div>

                                                        )}

                                                    </button>

                                                )

                                            })}

                                        </div>

                                    </div>

                                </div>

                            ) : (

                                <div className="relative bg-gray-200 rounded-xl shadow-lg overflow-hidden aspect-video flex items-center justify-center">

                                    <div className="text-center">

                                        <div className="animate-pulse mb-2">

                                            <svg className="w-12 h-12 text-gray-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">

                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />

                                            </svg>

                                        </div>

                                        <p className="text-gray-500">Loading gallery...</p>

                                    </div>

                                </div>

                            )}

                        </div>

                    ))}

                </div>

            </div>



            {/* Research Collaboration */}

            <div className="bg-white py-16">

                <div className="max-w-6xl mx-auto px-4">

                    <h2 className="text-4xl font-bold text-gray-900 mb-8 text-center">Research Collaboration</h2>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

                        <div className="bg-blue-50 rounded-xl p-6 border-2 border-blue-200">

                            <h3 className="text-xl font-bold text-blue-900 mb-3">Duke University</h3>

                            <p className="text-gray-700">School of Medicine, School of Nursing, and Global Health Institute</p>

                            <p className="text-sm text-gray-600 mt-2">Kearsley Stewart, Charmaine Royal, Nirmish Shah, Stephanie Ibemere</p>

                        </div>

                        <div className="bg-emerald-50 rounded-xl p-6 border-2 border-emerald-200">

                            <h3 className="text-xl font-bold text-emerald-900 mb-3">Makerere University</h3>

                            <p className="text-gray-700">Mulago National Referral Hospital</p>

                            <p className="text-sm text-gray-600 mt-2">Deogratias Munube</p>

                        </div>

                        <div className="bg-purple-50 rounded-xl p-6 border-2 border-purple-200">

                            <h3 className="text-xl font-bold text-purple-900 mb-3">Kalangala Health Center IV</h3>

                            <p className="text-gray-700">Local Clinical Leadership</p>

                            <p className="text-sm text-gray-600 mt-2">Joel Kibonwabake, Clinic Director</p>

                        </div>

                    </div>



                    <div className="mt-8 bg-gradient-to-r from-blue-100 to-purple-100 rounded-xl p-6 border-2 border-blue-300">

                        <h3 className="text-xl font-bold text-gray-900 mb-3">Local Community NGO</h3>

                        <p className="text-lg text-gray-700 mb-2">

                            <strong>Kunihira Sickle Cell Organization (KUHSCO)</strong>, Kalangala, Uganda

                        </p>

                        <p className="text-gray-600">A grassroots organization dedicated to supporting patients and families affected by sickle cell disease in our community.</p>

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



            {/* Data Visualization Section */}

            <div className="bg-gray-50 py-16">

                <div className="max-w-6xl mx-auto px-4">

                    <h2 className="text-4xl font-bold text-gray-900 mb-8 text-center">Impact by the Numbers</h2>


                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">

                        {/* Transportation Analysis */}

                        <div className="bg-white rounded-xl shadow-lg p-6">

                            <h3 className="text-xl font-bold text-gray-900 mb-4">Transportation Challenges</h3>

                            <p className="text-gray-600 mb-4">Average transport costs and times show the barriers our patients face</p>

                            <ResponsiveContainer width="100%" height={300}>

                                <BarChart data={transportationAnalysis}>

                                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />

                                    <XAxis dataKey="mode" angle={-45} textAnchor="end" height={100} />

                                    <YAxis />

                                    <Tooltip

                                        formatter={(value, name) => [

                                            name === 'avgCost' ? `${(value / 1000).toFixed(0)}K UGX` : `${value} patients`,

                                            name === 'avgCost' ? 'Avg Cost' : 'Patients'

                                        ]}

                                    />

                                    <Legend />

                                    <Bar dataKey="patients" fill="#2563eb" name="Patients" />

                                </BarChart>

                            </ResponsiveContainer>

                        </div>



                        {/* Pills Distribution */}

                        <div className="bg-white rounded-xl shadow-lg p-6">

                            <h3 className="text-xl font-bold text-gray-900 mb-4">Medication Support by Source</h3>

                            <p className="text-gray-600 mb-4">Distribution of hydroxyurea pills purchased by funding source</p>

                            <ResponsiveContainer width="100%" height={300}>

                                <PieChart>

                                    <Pie

                                        data={pillsAnalysis}

                                        dataKey="pills"

                                        nameKey="name"

                                        cx="50%"

                                        cy="50%"

                                        outerRadius={100}

                                        label={({ name, percent }) => percent > 0.05 ? `${name}: ${(percent * 100).toFixed(0)}%` : ''}

                                    >

                                        {pillsAnalysis.map((entry, index) => (

                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />

                                        ))}

                                    </Pie>

                                    <Tooltip formatter={(value) => [`${value.toLocaleString()} pills`, 'Pills Purchased']} />

                                    <Legend />

                                </PieChart>

                            </ResponsiveContainer>

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



            {/* Donate Section */}

            <div id="donate-section" className="bg-gradient-to-br from-emerald-700 to-blue-800 text-white py-20">

                <div className="max-w-4xl mx-auto px-4 text-center">

                    <h2 className="text-5xl font-bold mb-6">Make a Difference Today</h2>

                    <p className="text-2xl mb-8 text-emerald-100">Every donation brings life-saving treatment to children who need it most</p>


                    <div className="bg-white rounded-xl shadow-2xl p-8 text-gray-900 mb-8">

                        <h3 className="text-2xl font-bold mb-6">Giving Through Duke University</h3>


                        <div className="space-y-4 text-left mb-6">

                            <div className="flex items-start">

                                <svg className="w-6 h-6 text-emerald-600 mr-3 flex-shrink-0 mt-1" fill="currentColor" viewBox="0 0 20 20">

                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />

                                </svg>

                                <p>All gifts go specifically to the <strong>"Sickle Cell Research and Education in Uganda"</strong> fund</p>

                            </div>

                            <div className="flex items-start">

                                <svg className="w-6 h-6 text-emerald-600 mr-3 flex-shrink-0 mt-1" fill="currentColor" viewBox="0 0 20 20">

                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />

                                </svg>

                                <p>All funds are <strong>audited by Duke University</strong> and distributed directly by Professor Kearsley Stewart</p>

                            </div>

                            <div className="flex items-start">

                                <svg className="w-6 h-6 text-emerald-600 mr-3 flex-shrink-0 mt-1" fill="currentColor" viewBox="0 0 20 20">

                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />

                                </svg>

                                <p>All gifts are <strong>tax exempt</strong></p>

                            </div>

                        </div>



                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">

                            <div className="bg-blue-50 rounded-lg p-6 border-2 border-blue-300">

                                <h4 className="font-bold text-lg mb-3 text-blue-900">Online Donation</h4>

                                <p className="text-sm text-gray-700 mb-4">Credit card, PayPal, eCheck, Venmo</p>

                                <a

                                    href="https://www.gifts.duke.edu/?designation=391001102"

                                    target="_blank"

                                    rel="noopener noreferrer"

                                    className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-all duration-200 hover:scale-105"

                                >

                                    Donate Online

                                </a>

                            </div>



                            <div className="bg-emerald-50 rounded-lg p-6 border-2 border-emerald-300">

                                <h4 className="font-bold text-lg mb-3 text-emerald-900">Check by Mail</h4>

                                <p className="text-sm text-gray-700 mb-2">Write on check: <strong>DGHI-Sickle Cell Research and Education in Uganda</strong></p>

                                <p className="text-sm text-gray-700 mb-2">Or fund number: <strong>391001102</strong></p>

                                <p className="text-xs text-gray-600 mt-3">

                                    Mail to: Office of Alumni and Development Records, Duke University, Box 90581, Durham, NC 27708-0581

                                </p>

                            </div>

                        </div>



                        <div className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-lg p-6 border-2 border-orange-300">

                            <h4 className="font-bold text-lg mb-3 text-orange-900">Duke Student GoFundMe</h4>

                            <a

                                href="https://www.gofundme.com/f/help-patients-in-uganda-access-lifesaving-medication"

                                target="_blank"

                                rel="noopener noreferrer"

                                className="inline-block bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-6 rounded-lg transition-all duration-200 hover:scale-105"

                            >

                                Donate via GoFundMe

                            </a>

                        </div>

                    </div>



                    <p className="text-3xl font-bold text-white">Webale nyo! (Thank you!)</p>

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

