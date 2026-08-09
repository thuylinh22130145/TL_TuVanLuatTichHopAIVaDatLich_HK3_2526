import LawyerAvatar from './LawyerAvatar';

export default function LawyerCard({ lawyer, selected, onSelect }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(lawyer)}
      className={`card w-full text-left transition ${
        selected ? 'ring-2 ring-law-gold' : 'hover:border-law-gold/40'
      }`}
    >
      <div className="flex gap-4">
        <LawyerAvatar lawyer={lawyer} className='h-14 w-14 text-lg' />
        <div>
          <h3 className="font-semibold text-law-navy">{lawyer.name}</h3>
          <p className="text-xs text-law-gold">{lawyer.title}</p>
          <p className="mt-1 text-sm text-law-slate">{lawyer.specialty}</p>
          <p className="mt-1 text-xs text-law-slate">{lawyer.experience} năm kinh nghiệm</p>
        </div>
      </div>
    </button>
  );
}
