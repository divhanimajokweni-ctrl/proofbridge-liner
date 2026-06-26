export default function GatewayLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <style>{`body > nav, body > header { display: none !important; } body { background: #07090C !important; margin: 0; } html { background: #07090C; }`}</style>
      {children}
    </>
  );
}
