import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

export function HomePage() {
  const [counter, setCounter] = useState(4520103.00)
  const cardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const interval = setInterval(() => {
      setCounter(prev => prev + Math.random() * 50)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!cardRef.current || window.innerWidth < 1024) return
      const xAxis = (window.innerWidth / 2 - e.pageX) / 25
      const yAxis = (window.innerHeight / 2 - e.pageY) / 25
      cardRef.current.style.transform = `rotateY(${xAxis}deg) rotateX(${yAxis}deg)`
    }

    const handleMouseLeave = () => {
      if (cardRef.current) {
        cardRef.current.style.transform = 'rotateY(0deg) rotateX(0deg)'
      }
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseleave', handleMouseLeave)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [])

  return (
    <div className="grid lg:grid-cols-2 gap-12 items-center mt-12">
      <div className="space-y-8">
        <span className="inline-block py-1 px-3 rounded-full lime-bg text-black text-xs font-bold uppercase tracking-widest">
          Available in Ukraine 🇺🇦
        </span>
        <h1 className="text-6xl md:text-8xl font-black oswald leading-none uppercase">
          The Future of <br /><span className="lime-text">Payments</span>
        </h1>
        <p className="text-gray-400 text-lg md:text-xl max-w-lg leading-relaxed font-bold">
          No paperwork. No queues. Just pure lime-flavored commerce for the next generation of business owners.
        </p>

        <div className="glass-card p-6 inline-block border-[var(--lime-primary)]/20">
          <div className="text-gray-400 text-xs uppercase font-bold mb-1">Total Processed Today</div>
          <div className="text-4xl font-black lime-text counter-glow">
            ₴ {counter.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row">
          <Link to="/register" className="btn-lime px-12 py-4 rounded-2xl text-lg shadow-xl text-center">
            Get Started Now
          </Link>
        </div>
      </div>

      <div className="relative flex justify-center items-center py-20">
        <div className="absolute w-80 h-80 bg-lime-400/20 blur-[100px] rounded-full"></div>
        <div
          ref={cardRef}
          className="lime-card w-full max-w-md aspect-[1.6/1] rounded-[32px] p-8 relative overflow-hidden"
        >
          <div className="w-12 h-10 bg-black/10 rounded-lg mb-8 border border-white/20"></div>
          <div className="space-y-1">
            <div className="text-black/60 font-bold text-xs uppercase tracking-tighter">Business Elite</div>
            <div className="text-black font-black text-2xl tracking-widest oswald">4242 0000 1337 2024</div>
          </div>
          <div className="absolute bottom-8 right-8 text-black font-black text-3xl fancy-nav">LIME</div>
          <div className="absolute bottom-8 left-8 text-black/80 font-bold text-sm uppercase">YUNG MERCHANT</div>
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
        </div>
      </div>
    </div>
  )
}
