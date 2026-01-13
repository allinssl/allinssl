declare module 'particlesjs' {
	interface ParticlesOptions {
		selector: string
		maxParticles?: number
		sizeVariations?: number
		speed?: number
		color?: string | string[]
		minDistance?: number
		connectParticles?: boolean
		responsive?: Array<{
			breakpoint: number
			options: Partial<ParticlesOptions>
		}>
	}

	class Particles {
		static init(options: ParticlesOptions): void
	}

	export default Particles
}
