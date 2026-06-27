interface HomeSectionHeaderProps {
  eyebrow: string
  title: string
  description: string
}

export function HomeSectionHeader({
  eyebrow,
  title,
  description,
}: HomeSectionHeaderProps) {
  return (
    <div className="max-w-3xl">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-700">
        {eyebrow}
      </p>
      <h2 className="mt-3 text-3xl font-bold tracking-normal text-slate-950 sm:text-4xl">
        {title}
      </h2>
      <p className="mt-4 text-base leading-7 text-slate-600">{description}</p>
    </div>
  )
}
