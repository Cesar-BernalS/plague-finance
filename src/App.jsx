import React, { useState, useMemo, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { DollarSign, Globe, Users, TrendingUp, MessageSquare, X, Send, Bot, User, Target, Sparkles, Clock, AlertTriangle, CheckCircle, Info, Lock, Zap, Shield, Heart, Aperture, RefreshCw, Trophy } from 'lucide-react';

// --- Constantes de la API de Gemini ---
const API_KEY = "AIzaSyCNvJSJVnbPK9NawKwYd1Y-fDBf-dMMplY"; // La API key se inyectará en el entorno.
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;
const INVESTMENT_COST = 10000; // Costo fijo para todas las inversiones de mercado
const INITIAL_TIME = 300; // 5 minutos = 300 segundos

/**
 * Función helper para llamar a la API de Gemini con reintentos (exponential backoff).
 */
async function fetchWithBackoff(apiUrl, payload, maxRetries = 3) {
  let attempt = 0;
  while (attempt < maxRetries) {
    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        return await response.json();
      }

      // No reintentar en errores del cliente (ej. 400 Bad Request)
      if (response.status >= 400 && response.status < 500) {
        console.error(`Error de cliente API: ${response.statusText}`);
        return null; 
      }
      
      // Reintentar en errores de servidor (5xx) o throttling (429)
    } catch (error) {
      console.warn(`Error de red o fetch, reintentando... (${error.message})`);
    }

    const delay = Math.pow(2, attempt) * 1000 + Math.random() * 1000;
    await new Promise(resolve => setTimeout(resolve, delay));
    attempt++;
  }
  console.error("No se pudo obtener respuesta de la API de Gemini después de varios reintentos.");
  return null;
}

// --- Definiciones de Eventos del Juego (Actualizados a Continentes/Finanzas) ---
const gameEvents = [
  { type: 'bad', name: 'Crisis Geopolítica', impact: 'influence', magnitude: -25, message: '¡Una gran crisis golpea [COUNTRY]! Tu influencia en la región se desploma.' },
  { type: 'bad', name: 'Desastre Económico', impact: 'economy', magnitude: -50, message: 'Un desastre económico en [COUNTRY] reduce el valor de su economía.' },
  { type: 'bad', name: 'Bloqueo Comercial', impact: 'influence', magnitude: -15, message: 'Un bloqueo comercial en [COUNTRY] desestabiliza tus operaciones de influencia.' },
  { type: 'bad', name: 'Colapso de Mercado', impact: 'economy', magnitude: -100, message: 'Colapso total del mercado en [COUNTRY]. Economía local en ruinas.' },
  { type: 'good', name: 'Inversión Milmillonaria', impact: 'money', magnitude: 50000, message: '¡Un nuevo tratado en [COUNTRY] te otorga $50,000 en fondos de apoyo.' },
  { type: 'good', name: 'Avance en I+D', impact: 'research', magnitude: 10, message: 'Un gran avance científico en [COUNTRY] te otorga 10 Puntos de I+D.' },
  { type: 'good', name: 'Crecimiento Exponencial', impact: 'money', magnitude: 25000, message: 'El crecimiento inesperado en [COUNTRY] genera $25,000 de ganancia.' }
];


// --- Estado Inicial del Juego ---
const initialAssets = {
  money: 150000,
  influence: 100,
  researchPoints: 20,
};

const initialMapData = {
  'North America': { infected: 0, vulnerability: 0.7, economy: 2500 },
  'South America': { infected: 0, vulnerability: 0.8, economy: 700 },
  'Europe': { infected: 0, vulnerability: 0.5, economy: 3000 },
  'Asia': { infected: 0, vulnerability: 0.6, economy: 4000 },
  'Africa': { infected: 0, vulnerability: 0.9, economy: 800 },
  'Oceania': { infected: 0, vulnerability: 0.4, economy: 500 },
};

// --- Mercados Globales Actualizados y Simplificados ---
const initialMarketData = [
  { day: 1, 'BioTech': 100, 'Security': 120, 'Investment': 100 },
  { day: 2, 'BioTech': 105, 'Security': 118, 'Investment': 102 },
  { day: 3, 'BioTech': 110, 'Security': 122, 'Investment': 105 },
  { day: 4, 'BioTech': 108, 'Security': 125, 'Investment': 110 },
  { day: 5, 'BioTech': 115, 'Security': 130, 'Investment': 112 },
];

const initialMessages = [
    { sender: 'ai', text: 'Bienvenido a Plague-Finance. Tus acciones impactarán la economía global. ¿Cuál es tu primer movimiento?' }
];

// Función para inicializar o resetear el juego
const getInitialState = () => ({
    assets: initialAssets,
    mapData: initialMapData,
    marketData: initialMarketData,
    messages: initialMessages,
    timeLeft: INITIAL_TIME,
    isGameActive: true,
    notification: null,
});

// --- Componente Principal: App ---
export default function App() {
  // --- Estados del Juego ---
  const [isLoggedIn, setIsLoggedIn] = useState(false); 
  const [gameState, setGameState] = useState(getInitialState());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [isAiLoading, setIsAiLoading] = useState(false); 
  
  const { assets, mapData, marketData, messages, timeLeft, isGameActive, notification } = gameState;
  
  // Costo fijo para la mejora de I+D
  const RD_UPGRADE_COST = 5; 

  // Función para iniciar el juego (simulando login exitoso)
  const startGame = () => {
    setIsLoggedIn(true);
    setGameState(getInitialState()); // Asegurarse de que el estado inicial se carga
  };

  // Función para reiniciar el juego
  const resetGame = () => {
      setGameState(getInitialState());
      setIsModalOpen(false);
      setSelectedCountry(null);
      setIsAiLoading(false);
  };


  // --- Función para actualizar la Vulnerabilidad de los Continentes ---
  const updateVulnerability = () => {
    setGameState(prev => {
        const newMap = { ...prev.mapData };
        for (const continent in newMap) {
          let currentVulnerability = newMap[continent].vulnerability;
          
          // Cambio aleatorio entre -0.05 y +0.05
          const change = (Math.random() * 0.1) - 0.05; 
          let newVulnerability = currentVulnerability + change;
          
          // Asegurarse de que la vulnerabilidad se mantenga entre 0.1 y 1.0 (para evitar extremos)
          newVulnerability = Math.max(0.1, Math.min(1.0, newVulnerability));

          newMap[continent] = { ...newMap[continent], vulnerability: newVulnerability };
        }
        return { ...prev, mapData: newMap };
    });
  };

  // --- Game Loop (Timer y Eventos) ---
  useEffect(() => {
    // El loop solo corre si el usuario ha iniciado sesión Y el juego está activo.
    if (!isGameActive || !isLoggedIn) return; 

    const interval = setInterval(() => {
      setGameState(prev => {
        const prevTime = prev.timeLeft;
        if (prevTime <= 1) {
          // --- GAME OVER ---
          clearInterval(interval);
          return {
            ...prev,
            isGameActive: false,
            notification: { type: 'info', message: '¡Juego Terminado! Se acabó el tiempo.' },
            timeLeft: 0,
          };
        }

        const newTime = prevTime - 1;
        
        // --- Disparador de Eventos Aleatorios (cada 10 segundos) ---
        if (newTime % 10 === 0 && Math.random() < 0.4) { // 40% de chance cada 10 seg
          triggerRandomEvent();
        }
        
        // --- Variación de Vulnerabilidad (cada 5 segundos) ---
        if (newTime % 5 === 0) {
          updateVulnerability();
        }

        return { ...prev, timeLeft: newTime };
      });
    }, 1000);

    // Cleanup
    return () => clearInterval(interval);
  }, [isGameActive, isLoggedIn]); 

  // --- Función para disparar eventos (DEBE estar fuera del useEffect para evitar linting warnings, pero modificamos el estado de manera segura) ---
  const triggerRandomEvent = () => {
    const event = gameEvents[Math.floor(Math.random() * gameEvents.length)];
    const countryKeys = Object.keys(initialMapData); // Usar initialMapData para la lista de países
    // Ahora selecciona un continente
    const continent = countryKeys[Math.floor(Math.random() * countryKeys.length)]; 

    handleEvent(event, continent);
  };

  // --- Función para manejar el efecto de un evento ---
  const handleEvent = (event, continent) => {
    const message = event.message.replace('[COUNTRY]', continent);
    
    setGameState(prev => {
        // 1. Mostrar Notificación
        const newNotification = { type: event.type, message };
        
        // 2. Aplicar Efectos
        let newAssets = { ...prev.assets };
        let newMapData = { ...prev.mapData };

        switch (event.impact) {
          case 'money':
            newAssets.money = newAssets.money + event.magnitude;
            break;
          case 'research':
            newAssets.researchPoints = newAssets.researchPoints + event.magnitude;
            break;
          case 'influence':
            const continentDataInf = newMapData[continent];
            // El impacto en la influencia depende de la vulnerabilidad
            const impact = event.magnitude * continentDataInf.vulnerability;
            const newInfected = Math.max(0, continentDataInf.infected + impact); 
            newMapData[continent] = { ...continentDataInf, infected: newInfected };
            break;
          case 'economy':
            const continentDataEco = newMapData[continent];
            const newEconomy = Math.max(50, continentDataEco.economy + event.magnitude); // previene eco negativa
            newMapData[continent] = { ...continentDataEco, economy: newEconomy };
            break;
          default:
            console.warn(`Evento desconocido: ${event.name}`);
        }
        
        return { ...prev, assets: newAssets, mapData: newMapData, notification: newNotification };
    });

    // Ocultar notificación después de 5 segundos
    setTimeout(() => {
        setGameState(prev => ({ ...prev, notification: null }));
    }, 5000);
  };

  /**
   * FUNCIÓN: Maneja todas las inversiones de mercado.
   */
  const handleMarketInvestment = (continent, type) => {
    if (assets.money < INVESTMENT_COST) {
      addMessage('ai', 'Fondos insuficientes para esta operación. Necesitas $10,000.');
      return;
    }

    setGameState(prev => {
        let newAssets = { ...prev.assets, money: prev.assets.money - INVESTMENT_COST };
        let newMapData = { ...prev.mapData };
        let notificationMessage = `Inversión de $${INVESTMENT_COST} en ${continent} (${type}) procesada.`;
        let newMarketData = [...prev.marketData];
        
        const continentData = newMapData[continent];
        let newContinentData = { ...continentData };

        switch (type) {
          case 'BioTech':
            // Alto Impacto en Influencia y Economía local
            newContinentData.infected = Math.min(100, continentData.infected + 10); // +10 Influencia
            newContinentData.economy = continentData.economy + 100; // +$100M Economía
            notificationMessage += " +10 Influencia y +$100M a la economía local.";
            break;

          case 'Security':
            // Reducción permanente de Vulnerabilidad
            newContinentData.vulnerability = Math.max(0.1, continentData.vulnerability * 0.95); // -5% Vulnerabilidad
            newContinentData.infected = Math.min(100, continentData.infected + 3); // Pequeña ganancia de influencia
            notificationMessage += ` Vulnerabilidad reducida al ${(newContinentData.vulnerability * 100).toFixed(1)}%.`;
            break;
            
          case 'Investment':
            // Retorno de dinero y Aumento de Influencia GLOBAL
            newAssets.money += 5000; // Retorno $5,000
            newAssets.influence += 5; // +5 Influencia Global
            notificationMessage += " Retorno de $5,000 y +5 Influencia Global.";
            break;
          
          default:
            // No debería pasar
            return prev;
        }

        // Actualizar el mapa de datos
        newMapData[continent] = newContinentData;

        // Actualizar el gráfico (simulación)
        newMarketData = [
          ...prev.marketData,
          {
            day: prev.marketData.length + 1,
            // La inversión aumenta ligeramente el índice correspondiente
            'BioTech': prev.marketData.slice(-1)[0]['BioTech'] + (type === 'BioTech' ? 5 : 0) + Math.random() * 2 - 1,
            'Security': prev.marketData.slice(-1)[0]['Security'] + (type === 'Security' ? 5 : 0) + Math.random() * 2 - 1,
            'Investment': prev.marketData.slice(-1)[0]['Investment'] + (type === 'Investment' ? 5 : 0) + Math.random() * 2 - 1, 
          }
        ];
        
        // Agregar mensaje después de la transacción
        addMessage('ai', notificationMessage);
        setIsModalOpen(false); // Cerrar modal después de la inversión

        return { ...prev, assets: newAssets, mapData: newMapData, marketData: newMarketData };
    });
  };


  // Función para manejar la mejora de I+D (SIN CAMBIOS)
  const handleRDUpgrade = (continent) => {
    if (assets.researchPoints >= RD_UPGRADE_COST) { 
        setGameState(prev => {
            let newAssets = { ...prev.assets, researchPoints: prev.assets.researchPoints - RD_UPGRADE_COST };
            let newMapData = { ...prev.mapData };
            
            const continentData = newMapData[continent];
            // Reducir la vulnerabilidad en un 10%, asegurando que no baje de 0.1
            const newVulnerability = Math.max(0.1, continentData.vulnerability * 0.90); 
            
            addMessage('ai', `I+D aplicado en ${continent}. La inversión en investigación ha reducido la vulnerabilidad base de la región al ${(newVulnerability * 100).toFixed(1)}%.`);
            
            newMapData[continent] = { ...continentData, vulnerability: newVulnerability };

            setIsModalOpen(false);

            return { ...prev, assets: newAssets, mapData: newMapData };
        });
    } else {
      addMessage('ai', `Puntos de I+D insuficientes (Costo: ${RD_UPGRADE_COST} puntos).`);
    }
  };


  // Función para abrir el modal al hacer clic en un continente
  const handleCountryClick = (continentName) => {
    if (!isGameActive) return; // No abrir modal si el juego terminó
    setSelectedCountry(continentName);
    setIsModalOpen(true);
  };
  
  // Función para añadir mensajes al chat
  const addMessage = (sender, text) => {
    setGameState(prev => ({ ...prev, messages: [...prev.messages, { sender, text }] }));
  };

  const handleSendMessage = async (userMessage) => {
    addMessage('user', userMessage);
    setIsAiLoading(true);

    // --- LLAMADA A GEMINI API (CHAT) ---
    const systemPrompt = "Eres 'M.A.I.A' (Monetary & Influence AI Advisor), una IA asesora en el juego 'Plague-Finance'. Tu tono es profesional, siniestro y calculador. Analizas datos de un juego de simulación donde el jugador expande su 'influencia' (como una plaga) a través de inversiones financieras. El mapa es por CONTINENTES. *Nunca* rompas el personaje. Da consejos estratégicos y financieros. Sé concisa (2-3 frases).";

    // Damos contexto del estado actual del juego a la IA
    const gameStateContext = `Estado Actual: Fondos: $${assets.money}, Influencia: ${assets.influence}, Puntos I+D: ${assets.researchPoints}. Estado del Mapa (Continentes): ${JSON.stringify(mapData)}`;
    const userQuery = `Contexto del Juego: ${gameStateContext}\n\nUsuario: ${userMessage}`;

    const payload = {
      contents: [{ parts: [{ text: userQuery }] }],
      systemInstruction: { parts: [{ text: systemPrompt }] },
      generationConfig: { temperature: 0.7 }
    };

    let aiResponse = "Error de conexión con la IA. Intenta de nuevo.";

    try {
      const result = await fetchWithBackoff(API_URL, payload);
      if (result && result.candidates?.[0]?.content?.parts?.[0]?.text) {
        aiResponse = result.candidates[0].content.parts[0].text;
      }
    } catch (error) {
      console.error("Error al llamar a Gemini API:", error);
      aiResponse = "Mis circuitos están fallando. No puedo procesar la solicitud.";
    }
    // --- FIN DE LLAMADA A GEMINI API ---

    addMessage('ai', aiResponse);
    setIsAiLoading(false);
  };

  // --- Renderizado de la UI ---
  
  if (!isLoggedIn) {
    return <Login onLogin={startGame} />;
  }
  
  // Si el juego ha terminado, muestra la pantalla final
  if (!isGameActive) {
      return <GameOverScreen assets={assets} mapData={mapData} onRestart={resetGame} />;
  }

  return (
    <div className="flex h-screen w-full bg-gray-900 text-gray-100 font-sans">
      
      {/* --- Notificación de Eventos --- */}
      <NotificationDisplay notification={notification} />

      {/* --- Panel Izquierdo (Activos y Chat) --- */}
      <aside className="w-1/4 h-full flex flex-col p-4 space-y-4 border-r border-gray-700">
        <h1 className="text-3xl font-bold text-red-500 tracking-wider">PLAGUE-FINANCE</h1>
        <AssetPanel assets={assets} timeLeft={timeLeft} />
        <ChatAI 
          messages={messages} 
          onSendMessage={handleSendMessage} 
          isLoading={isAiLoading} 
        />
      </aside>

      {/* --- Área Principal (Mapa y Gráficos) --- */}
      <main className="w-3/4 h-full flex flex-col p-4">
        <div className="flex-grow h-2/3">
          <MapView mapData={mapData} onCountryClick={handleCountryClick} />
        </div>
        <div className="flex-grow h-1/3 pt-4">
          <ChartView data={marketData} />
        </div>
      </main>

      {/* --- Modal de Inversión (Oculto por defecto) --- */}
      <InvestModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onMarketInvest={handleMarketInvestment} // Nueva función de inversión de mercado
        onRDUpgrade={handleRDUpgrade} 
        RD_UPGRADE_COST={RD_UPGRADE_COST} 
        INVESTMENT_COST={INVESTMENT_COST} // Pasar el costo fijo
        country={selectedCountry}
        countryData={selectedCountry ? mapData[selectedCountry] : null}
        assets={assets}
      />
    </div>
  );
}

// --- Componente: Login ---
function Login({ onLogin }) {
  return (
    <div className="flex items-center justify-center h-screen w-full bg-gray-900 text-gray-100 font-sans p-4">
        <div className="bg-gray-800 p-10 rounded-xl shadow-2xl w-full max-w-md text-center border-t-4 border-red-600 transform transition-all hover:scale-[1.02]">
            
            <h1 className="text-5xl font-extrabold text-red-500 mb-4 tracking-tighter">
                PLAGUE-FINANCE
            </h1>
            <p className="text-xl font-light text-gray-300 mb-8 italic">
                "¿Estás listo para gobernar el mundo con tus finanzas?"
            </p>
            
            <div className="space-y-4 mb-8">
                <input
                    type="text"
                    placeholder="Nombre de Usuario"
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-5 py-3 text-lg text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition duration-150"
                />
                <input
                    type="password"
                    placeholder="Contraseña"
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-5 py-3 text-lg text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition duration-150"
                />
            </div>

            <button
                onClick={onLogin}
                className="w-full flex items-center justify-center bg-red-600 text-white text-xl font-bold py-3 rounded-lg shadow-lg hover:bg-red-700 transition duration-150 transform hover:scale-[1.01] focus:outline-none focus:ring-4 focus:ring-red-500 focus:ring-opacity-50"
            >
                <Lock className="w-6 h-6 mr-3" />
                Iniciar Operaciones
            </button>
            
            <p className="mt-6 text-sm text-gray-500">
                Esta es una simulación de acceso. Haz clic para continuar.
            </p>

        </div>
    </div>
  );
}

// --- Componente: AssetPanel ---
// Helper para formatear el tiempo
const formatTime = (seconds) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
};

function AssetPanel({ assets, timeLeft }) {
  return (
    <div className="bg-gray-800 p-4 rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-300">Panel de Activos</h2>
        <div className="flex items-center bg-red-800 text-white px-3 py-1 rounded-full">
          <Clock className="w-5 h-5 mr-2" />
          <span className="font-mono text-lg">{formatTime(timeLeft)}</span>
        </div>
      </div>
      
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="flex items-center text-green-400">
            <DollarSign className="w-5 h-5 mr-2" />
            Fondos
          </span>
          <span className="font-mono text-lg">${assets.money.toLocaleString()}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="flex items-center text-blue-400">
            <Globe className="w-5 h-5 mr-2" />
            Influencia Global
          </span>
          <span className="font-mono text-lg">{assets.influence.toLocaleString()}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="flex items-center text-purple-400">
            <Zap className="w-5 h-5 mr-2" /> 
            Puntos de I+D
          </span>
          <span className="font-mono text-lg">{assets.researchPoints.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}

// --- Componente: MapView (Actualizado para Continentes) ---
function MapView({ mapData, onCountryClick }) {
  const continents = Object.keys(mapData);
  
  // Mapeo de colores para mejorar la visualización inicial de los 6 continentes
  const continentColors = useMemo(() => ({
    'North America': 'bg-teal-700',
    'South America': 'bg-yellow-700',
    'Europe': 'bg-blue-700',
    'Asia': 'bg-red-700',
    'Africa': 'bg-orange-700',
    'Oceania': 'bg-indigo-700',
  }), []);

  return (
    <div className="bg-gray-800 w-full h-full rounded-lg p-4 shadow-lg">
      <h2 className="text-xl font-semibold mb-4 text-gray-300">Mapa de Influencia (Continentes)</h2>
      <div className="grid grid-cols-3 grid-rows-2 gap-4 h-[calc(100%-40px)]">
        {continents.map(continent => {
          const data = mapData[continent];
          // El color de influencia (rojo) se multiplica sobre el color base
          const infectionOpacity = data.infected / 100;
          const baseColorClass = continentColors[continent] || 'bg-gray-600';
          
          return (
            <button
              key={continent}
              onClick={() => onCountryClick(continent)}
              className={`border-2 border-gray-600 rounded-lg flex flex-col justify-center items-center text-center p-4 transition-all duration-300 hover:border-red-500 hover:bg-gray-700 relative overflow-hidden ${baseColorClass}`}
            >
              <div 
                className="absolute inset-0 transition-opacity duration-300"
                style={{
                    backgroundColor: 'rgba(239, 68, 68, 0.7)', // Rojo de influencia
                    opacity: infectionOpacity,
                    pointerEvents: 'none'
                }}
              ></div>
              <span className="relative text-xl font-bold text-white z-10">{continent}</span>
              <span className="relative text-sm text-gray-200 z-10">Influencia: {data.infected.toFixed(1)}%</span>
              <span className="relative text-xs text-gray-300 z-10">Eco: ${data.economy}B</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// --- Componente: ChartView (Mercados Globales Simplificados) ---
function ChartView({ data }) {

  // Mapeo de nombres y colores para la leyenda
  const lines = [
    { key: 'Investment', name: 'Bolsa de Valores', color: '#F87171', icon: DollarSign },
    { key: 'BioTech', name: 'Bienes Raices', color: '#34D399', icon: Heart },
    { key: 'Security', name: 'Seguros', color: '#FBBF24', icon: Shield },
  ];

  const CustomLegend = (props) => {
    const { payload } = props;
    return (
      <ul className="flex justify-center space-x-6 text-sm mt-2">
        {payload.map((entry, index) => {
          const line = lines.find(l => l.key === entry.dataKey);
          if (!line) return null;
          const Icon = line.icon;
          return (
            <li key={`item-${index}`} className="flex items-center text-gray-300">
              <Icon className="w-4 h-4 mr-1" style={{ color: line.color }} />
              <span className="font-semibold">{line.name}</span>
            </li>
          );
        })}
      </ul>
    );
  };

  return (
    <div className="bg-gray-800 p-4 rounded-lg shadow-lg h-full w-full flex flex-col">
      <h2 className="text-xl font-semibold mb-2 text-gray-300 flex items-center">
        <TrendingUp className="w-5 h-5 mr-2 text-red-500" />
        Mercados Globales
      </h2>
      <div className="flex-grow">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 20, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#4B5563" />
            <XAxis dataKey="day" stroke="#9CA3AF" />
            <YAxis stroke="#9CA3AF" />
            <Tooltip
              contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #4B5563' }}
              labelStyle={{ color: '#F3F4F6' }}
              formatter={(value, name) => [`${value.toFixed(2)} pts`, lines.find(l => l.key === name)?.name || name]}
            />
            <Legend content={<CustomLegend />} />
            
            {lines.map(line => (
              <Line key={line.key} type="monotone" dataKey={line.key} stroke={line.color} strokeWidth={2} dot={false} />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// --- Componente: ChatAI ---
function ChatAI({ messages, onSendMessage, isLoading }) {
  const messagesEndRef = React.useRef(null);
  
  // Auto-scroll al final de los mensajes
  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);
    
  const [input, setInput] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input.trim()) {
      onSendMessage(input.trim());
      setInput('');
    }
  };

  return (
    <div className="bg-gray-800 p-4 rounded-lg shadow-lg flex flex-col h-full flex-grow">
      <h2 className="text-xl font-semibold mb-4 text-gray-300 flex items-center">
        <Bot className="w-5 h-5 mr-2 text-cyan-400" />
        Asistente IA (M.A.I.A.)
      </h2>
      <div className="flex-grow h-0 overflow-y-auto mb-4 pr-2 space-y-3">
        {messages.map((msg, index) => (
          <div key={index} className={`flex ${msg.sender === 'ai' ? 'justify-start' : 'justify-end'}`}>
            <div
              className={`max-w-xs lg:max-w-md px-3 py-2 rounded-lg ${
                msg.sender === 'ai'
                  ? 'bg-gray-700 text-gray-200'
                  : 'bg-red-600 text-white'
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
        {/* Indicador de carga de IA */}
        {isLoading && (
          <div className="flex justify-start items-center space-x-2 px-2">
            <Bot className="w-5 h-5 text-cyan-400 animate-spin" />
            <span className="text-sm text-gray-400 italic">M.A.I.A. está pensando...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSubmit} className="flex space-x-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={isLoading ? "Procesando..." : "Escribe tu pregunta o estrategia..."}
          className="flex-grow bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
          disabled={isLoading}
        />
        <button
          type="submit"
          className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
          disabled={isLoading}
        >
          {isLoading ? <div className="w-5 h-5 border-2 border-t-transparent border-white rounded-full animate-spin"></div> : <Send className="w-5 h-5" />}
        </button>
      </form>
    </div>
  );
}

// --- Componente: InvestModal ---
function InvestModal({ isOpen, onClose, onMarketInvest, onRDUpgrade, RD_UPGRADE_COST, INVESTMENT_COST, country, countryData, assets }) {
  const [analysis, setAnalysis] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Resetea el análisis cuando el modal se cierra o cambia de país
  React.useEffect(() => {
    if (isOpen) {
      setAnalysis('');
      setIsAnalyzing(false);
    }
  }, [isOpen, country]);

  if (!isOpen || !country || !countryData) return null;

  const canAffordMoney = assets.money >= INVESTMENT_COST;
  const canAffordRD = assets.researchPoints >= RD_UPGRADE_COST;

  /**
   * Manejador para el botón de análisis de IA
   */
  const handleAnalysisRequest = async () => {
    if (!countryData || !assets) return;
    setIsAnalyzing(true);
    setAnalysis(''); // Limpia análisis anterior

    // --- LLAMADA A GEMINI API (ANALISIS) ---
    const systemPrompt = "Eres un analista de riesgos de 'Plague-Finance'. Evalúa las oportunidades de inversión en un CONTINENTE. Tu análisis debe ser conciso (2-3 frases), enfocándote en las áreas clave: BioTech, Security, y Global Investment, mencionando la vulnerabilidad y economía. Tono: profesional y directo.";
    
    const userQuery = `Analiza las siguientes oportunidades de inversión en ${country}:
    - Economía: $${countryData.economy}B
    - Vulnerabilidad: ${(countryData.vulnerability * 100).toFixed(1)}%
    - Fondos disponibles: $${assets.money}
    - Costo de Inversión por acción: $${INVESTMENT_COST}.
    Dame un consejo sobre qué tipo de inversión (BioTech, Security, o Global) sería más estratégica aquí.`;
    
    const payload = {
      contents: [{ parts: [{ text: userQuery }] }],
      systemInstruction: { parts: [{ text: systemPrompt }] },
      generationConfig: { temperature: 0.5 }
    };

    let aiResponse = "No se pudo completar el análisis.";

    try {
      const result = await fetchWithBackoff(API_URL, payload);
      if (result && result.candidates?.[0]?.content?.parts?.[0]?.text) {
        aiResponse = result.candidates[0].content.parts[0].text;
      }
    } catch (error) {
      console.error("Error al llamar a Gemini API para análisis:", error);
      aiResponse = "Fallo en el sistema de análisis. Proceda con precaución.";
    }
    // --- FIN DE LLAMADA A GEMINI API ---

    setAnalysis(aiResponse);
    setIsAnalyzing(false);
  };
  
  // --- Definiciones de las Inversiones ---
  const investmentOptions = [
    { 
      type: 'BioTech', 
      name: 'Bienes Raíces', 
      icon: Heart, 
      color: 'green',
      effect: '+10 Influencia, +$100M Economía local.'
    },
    { 
      type: 'Security', 
      name: 'Seguros', 
      icon: Shield, 
      color: 'yellow',
      effect: '-5% Vulnerabilidad permanente, +3 Influencia local.'
    },
    { 
      type: 'Investment', 
      name: 'Bolsa de Valores', 
      icon: Aperture, // Usando Aperture para 'alto riesgo/alta recompensa'
      color: 'red',
      effect: '+$5,000 Fondos, +5 Influencia Global.'
    },
  ];


  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50">
      <div className="bg-gray-800 rounded-lg shadow-2xl p-6 w-full max-w-xl relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-white"
        >
          <X className="w-6 h-6" />
        </button>
        
        <h2 className="text-2xl font-bold mb-4 flex items-center text-red-500 border-b border-gray-700 pb-2">
          <Target className="w-6 h-6 mr-2" />
          Operación en: {country}
        </h2>
        
        <div className="space-y-2 text-gray-300 mb-6 bg-gray-700 p-3 rounded-lg">
          <p><strong>Economía:</strong> ${countryData.economy}B</p>
          <p><strong>Vulnerabilidad:</strong> <span className="text-yellow-400 font-semibold">{(countryData.vulnerability * 100).toFixed(1)}%</span> (Fluctuante)</p>
          <p><strong>Influencia Actual:</strong> {countryData.infected.toFixed(1)}%</p>
        </div>
        
        
        {/* --- Botón y Display de Análisis IA --- */}
        <div className="mb-6">
            <button
              type="button"
              onClick={handleAnalysisRequest}
              disabled={isAnalyzing}
              className="w-full flex justify-center items-center px-4 py-2 rounded-lg bg-cyan-600 text-white hover:bg-cyan-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isAnalyzing ? (
                <div className="w-5 h-5 border-2 border-t-transparent border-white rounded-full animate-spin mr-2"></div>
              ) : (
                <Sparkles className="w-5 h-5 mr-2" />
              )}
              {isAnalyzing ? 'Analizando...' : '✨ Analizar Riesgo con IA'}
            </button>
            
            {analysis && !isAnalyzing && (
              <div className="mt-3 p-3 bg-gray-700 border border-gray-600 rounded-lg">
                <p className="text-sm text-gray-200">{analysis}</p>
              </div>
            )}
        </div>
        {/* --- Fin de Análisis IA --- */}

        {/* --- Opciones de Inversión con Fondos --- */}
        <h3 className="text-xl font-bold text-gray-300 mb-3 border-b border-gray-700 pb-2">
            Inversiones ($<span className="text-green-400">{INVESTMENT_COST.toLocaleString()}</span> por acción)
        </h3>
        <div className="grid grid-cols-3 gap-4 mb-6">
            {investmentOptions.map(option => {
                const Icon = option.icon;
                const canBuy = canAffordMoney;
                return (
                    <div key={option.type} className={`p-3 rounded-lg shadow-lg border-2 ${canBuy ? 'border-gray-700 hover:border-red-500' : 'border-red-900 bg-red-900/30'}`}>
                        <div className={`flex items-center text-${option.color}-400 mb-2`}>
                            <Icon className="w-5 h-5 mr-2" />
                            <span className="font-semibold text-sm">{option.name}</span>
                        </div>
                        <p className="text-xs text-gray-400 mb-3 h-10">{option.effect}</p>
                        <button
                            onClick={() => onMarketInvest(country, option.type)}
                            disabled={!canBuy}
                            // Usar clases directas en lugar de interpolación de color para evitar problemas con Tailwind JIT
                            className={`w-full text-white py-2 rounded-md font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                                option.color === 'green' ? (canBuy ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-700') :
                                option.color === 'yellow' ? (canBuy ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-gray-700') :
                                option.color === 'red' ? (canBuy ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-700') :
                                'bg-gray-700'
                            }`}
                        >
                            Comprar
                        </button>
                    </div>
                );
            })}
        </div>


        {/* --- Opciones de I+D --- */}
        <h3 className="text-xl font-bold text-gray-300 mb-3 border-b border-gray-700 pb-2">
            Mejora con Puntos de I+D
        </h3>
        <div className="mb-4">
            <button
                type="button"
                onClick={() => onRDUpgrade(country)}
                disabled={!canAffordRD}
                className={`w-full flex items-center justify-center px-4 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                    canAffordRD ? 'bg-purple-600 hover:bg-purple-700 text-white' : 'bg-gray-700 text-gray-400'
                }`}
            >
                <Zap className="w-5 h-5 mr-2" />
                Optimizar Vulnerabilidad (-{RD_UPGRADE_COST} I+D)
            </button>
            {!canAffordRD && (
                 <p className="text-xs text-red-400 text-center mt-2">Necesitas {RD_UPGRADE_COST} Puntos de I+D para esta mejora.</p>
            )}
        </div>
        
        <div className="flex justify-end space-x-3 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-gray-600 hover:bg-gray-700 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

// --- Componente: Notificación de Eventos ---
function NotificationDisplay({ notification }) {
  if (!notification) return null;

  const colors = {
    bad: 'bg-red-600 border-red-400',
    good: 'bg-green-600 border-green-400',
    info: 'bg-blue-600 border-blue-400',
  };

  const Icon = {
    bad: AlertTriangle,
    good: CheckCircle,
    info: Info,
  }[notification.type];

  return (
    <div 
      className={`fixed top-5 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-lg shadow-2xl text-white border-2 ${colors[notification.type]} flex items-center max-w-lg animate-pulse`}
      style={{ animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }} // Añadí animación
    >
      <Icon className="w-6 h-6 mr-3" />
      <span className="font-medium">{notification.message}</span>
    </div>
  );
}


// --- NUEVO Componente: GameOverScreen ---
function GameOverScreen({ assets, mapData, onRestart }) {
  // Calcular el puntaje final basado en la influencia y los fondos
  const finalInfluence = Object.values(mapData).reduce((sum, data) => sum + data.infected, 0);
  const finalScore = Math.floor(finalInfluence * 100 + (assets.money / 1000));
  
  const totalEconomy = Object.values(mapData).reduce((sum, data) => sum + data.economy, 0);
  
  return (
    <div className="flex items-center justify-center h-screen w-full bg-gray-900 text-gray-100 font-sans p-4">
        <div className="bg-gray-800 p-10 rounded-xl shadow-2xl w-full max-w-lg text-center border-t-8 border-red-500 animate-fadeIn">
            
            <Trophy className="w-16 h-16 mx-auto mb-4 text-yellow-400 animate-bounce" />
            <h1 className="text-4xl font-extrabold text-red-500 mb-2 tracking-tight">
                OPERACIÓN FINALIZADA
            </h1>
            <p className="text-xl font-light text-gray-300 mb-8 italic">
                El tiempo se ha agotado. Es hora de evaluar tu legado.
            </p>
            
            <div className="bg-gray-700 p-6 rounded-lg mb-8 space-y-3">
                <div className="flex justify-between items-center text-xl font-semibold">
                    <span className="flex items-center text-blue-300"><Globe className="w-6 h-6 mr-2" /> Influencia Total</span>
                    <span className="text-red-400">{finalInfluence.toFixed(1)} puntos</span>
                </div>
                <div className="flex justify-between items-center text-xl font-semibold">
                    <span className="flex items-center text-green-300"><DollarSign className="w-6 h-6 mr-2" /> Fondos Finales</span>
                    <span className="text-green-400">${assets.money.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-2xl font-bold pt-4 border-t border-gray-600">
                    <span className="text-white">PUNTAJE FINAL</span>
                    <span className="text-yellow-400 text-3xl">{finalScore.toLocaleString()}</span>
                </div>
            </div>

            <button
                onClick={onRestart}
                className="w-full flex items-center justify-center bg-red-600 text-white text-xl font-bold py-3 rounded-lg shadow-lg hover:bg-red-700 transition duration-150 transform hover:scale-[1.01] focus:outline-none focus:ring-4 focus:ring-red-500 focus:ring-opacity-50"
            >
                <RefreshCw className="w-6 h-6 mr-3" />
                Reiniciar Operaciones
            </button>
        </div>
    </div>
  );
}


