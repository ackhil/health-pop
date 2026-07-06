export const metadata = {
  title: "Health Pop",
  description: "Your health, one log at a time",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700;800;900&display=swap" rel="stylesheet" />
        <style>{`
          body { margin: 0; background: #EFEAF4; }
          @keyframes faceBob { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-4px) } }
          @keyframes faceWiggle { 0%,100% { transform: rotate(-4deg) } 50% { transform: rotate(4deg) } }
          @keyframes facePulse { 0%,100% { transform: scale(1) } 50% { transform: scale(1.07) } }
          @keyframes coachFloat { 0%,100% { transform: translateY(0) scale(1); box-shadow: 0 4px 14px rgba(247,212,94,.6); } 50% { transform: translateY(-4px) scale(1.07); box-shadow: 0 10px 22px rgba(247,212,94,.85); } }
          .coach-pop { animation: coachFloat 2.4s ease-in-out infinite; border-radius: 999px; }
          @media (prefers-reduced-motion: reduce) { svg { animation: none !important } .coach-pop { animation: none !important } }
          input:focus, textarea:focus, select:focus { border-color: #141414 !important; }
          ::placeholder { color: #A9A5B3; font-weight: 600; }
        `}</style>
      </head>
      <body>{children}</body>
    </html>
  );
}
