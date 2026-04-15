export default function EmptyState({ icon = '📋', title, subtitle, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
      <div className="text-4xl mb-3 opacity-60">{icon}</div>
      <p className="text-textprimary font-semibold text-sm mb-1">{title}</p>
      {subtitle && <p className="text-textsecondary text-xs">{subtitle}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
