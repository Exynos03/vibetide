interface KoiFishProps {
    children?: React.ReactNode;
}

const KoiFish = ({ children }: KoiFishProps) => {
    return (
        <main
            className='relative h-screen w-full overflow-hidden bg-cover bg-center'
            style={{ backgroundImage: "url('/images/koi.webp')" }}
        >
            {/* Overlay for aesthetics and readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent backdrop-blur-[1.5px] z-0" />

            {/* Noise Texture */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none z-0 mix-blend-overlay"
                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}
            />

            {/* Content Wrapper */}
            <div className="relative z-10 w-full h-full">
                {children}
            </div>
        </main>
    )
}

export default KoiFish