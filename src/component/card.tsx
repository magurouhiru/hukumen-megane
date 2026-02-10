function Card({ children }: { children: React.ReactNode }) {
  return <div className="rounded border hover:shadow">{children}</div>;
}

export default Card;
