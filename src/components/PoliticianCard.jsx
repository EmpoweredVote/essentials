function PoliticianCard({ image, name, title, level }) {
  return (
    <div className="h-full mt-4">
      <div className="flex h-full w-full flex-col gap-2 rounded-lg bg-white p-4 text-center shadow-lg">
        <div className="relative w-full aspect-[4/5] overflow-hidden rounded-lg bg-zinc-100">
          <img
            src={image}
            alt={`${name} portrait`}
            className="absolute inset-0 h-full w-full object-cover"
          />
        </div>
        <h1 className="text-sky-950 font-bold text-lg">{name}</h1>
        <div>
          {/* Eventually add party logo here */}
          <p className="text-sky-900 leading-snug line-clamp-2 min-h-[2.5rem]">
            {title}
          </p>
        </div>
      </div>
    </div>
  );
}
export default PoliticianCard;
