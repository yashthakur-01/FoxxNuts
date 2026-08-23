export default function EmbedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <style>{`
        html, body {
          margin: 0;
          padding: 0;
          width: 100%;
          height: 100%;
          overflow: hidden;
          background: transparent;
        }
      `}</style>
      <div
        style={{
          background: 'transparent',
          width: '100%',
          height: '100dvh',
          overflow: 'hidden',
        }}
      >
        {children}
      </div>
    </>
  );
}
