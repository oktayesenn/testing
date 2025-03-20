import { useState, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Stars } from '@react-three/drei'
import './SnakeGame.css'

function Snake({ position, color }) {
  return (
    <mesh position={position}>
      <capsuleGeometry args={[0.3, 0.4, 8, 16]} />
      <meshStandardMaterial 
        color={color}
        metalness={0.6}
        roughness={0.2}
        emissive={color}
        emissiveIntensity={0.3}
      />
    </mesh>
  )
}

function SnakeConnector({ startPos, endPos, color }) {
  const midPoint = {
    x: (startPos.x + endPos.x) / 2,
    y: (startPos.y + endPos.y) / 2,
    z: (startPos.z + endPos.z) / 2,
  }

  const distance = Math.sqrt(
    Math.pow(endPos.x - startPos.x, 2) + 
    Math.pow(endPos.z - startPos.z, 2)
  )

  const angle = Math.atan2(
    endPos.z - startPos.z,
    endPos.x - startPos.x
  )

  return (
    <mesh 
      position={[midPoint.x, midPoint.y, midPoint.z]}
      rotation={[0, -angle, Math.PI / 2]}
    >
      <cylinderGeometry args={[0.2, 0.2, distance, 8]} />
      <meshStandardMaterial 
        color={color}
        metalness={0.6}
        roughness={0.2}
        emissive={color}
        emissiveIntensity={0.2}
      />
    </mesh>
  )
}

function BonusFood({ position }) {
  return (
    <mesh position={position}>
      <sphereGeometry args={[0.7]} />
      <meshStandardMaterial color="gold" emissive="orange" emissiveIntensity={0.5} />
    </mesh>
  )
}

function Food({ position, isBonus }) {
  if (isBonus) {
    return <BonusFood position={position} />
  }
  return (
    <mesh position={position}>
      <sphereGeometry args={[0.5]} />
      <meshStandardMaterial color="red" />
    </mesh>
  )
}

function Ground() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]}>
      <planeGeometry args={[20, 20]} />
      <meshStandardMaterial 
        color="#2a3eb1" 
        metalness={0.2}
        roughness={0.8}
        transparent={false}
      />
    </mesh>
  )
}

function Game({ onGameOver }) {
  const [snakePositions, setSnakePositions] = useState([{ x: 0, y: 0, z: 0 }])
  const [foodPosition, setFoodPosition] = useState({ x: 5, y: 0, z: 0 })
  const [direction, setDirection] = useState({ x: 1, y: 0, z: 0 })
  const [foodCount, setFoodCount] = useState(0)
  const [isBonusFood, setIsBonusFood] = useState(false)
  const [gameOver, setGameOver] = useState(false)

  const spawnFood = () => {
    const newPosition = {
      x: Math.floor(Math.random() * 20 - 10),
      y: 0,
      z: Math.floor(Math.random() * 20 - 10)
    }
    setFoodPosition(newPosition)
    
    const nextFoodCount = foodCount + 1
    setFoodCount(nextFoodCount)
    setIsBonusFood(nextFoodCount % 5 === 0)
  }

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (gameOver) return

      switch (event.key) {
        case 'ArrowUp':
          if (direction.z !== 1) setDirection({ x: 0, y: 0, z: -1 })
          break
        case 'ArrowDown':
          if (direction.z !== -1) setDirection({ x: 0, y: 0, z: 1 })
          break
        case 'ArrowLeft':
          if (direction.x !== 1) setDirection({ x: -1, y: 0, z: 0 })
          break
        case 'ArrowRight':
          if (direction.x !== -1) setDirection({ x: 1, y: 0, z: 0 })
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [direction, gameOver])

  useEffect(() => {
    if (gameOver) return

    const gameLoop = setInterval(() => {
      setSnakePositions(prevPositions => {
        let newHead = {
          x: prevPositions[0].x + direction.x,
          y: 0,
          z: prevPositions[0].z + direction.z
        }

        // Wrap around edges
        if (newHead.x > 10) newHead.x = -10
        if (newHead.x < -10) newHead.x = 10
        if (newHead.z > 10) newHead.z = -10
        if (newHead.z < -10) newHead.z = 10

        // Check self collision
        if (prevPositions.some(segment => 
          segment.x === newHead.x && segment.z === newHead.z
        )) {
          setGameOver(true)
          onGameOver(prevPositions.length - 1)
          return prevPositions
        }

        // Check food collision
        if (Math.abs(newHead.x - foodPosition.x) < 1 && 
            Math.abs(newHead.z - foodPosition.z) < 1) {
          spawnFood()
          return [newHead, ...prevPositions]
        }

        return [newHead, ...prevPositions.slice(0, -1)]
      })
    }, 200)

    return () => clearInterval(gameLoop)
  }, [direction, foodPosition, gameOver])

  return (
    <>
      {snakePositions.map((pos, index) => (
        <group key={index}>
          <Snake 
            position={[pos.x, pos.y, pos.z]} 
            color={index === 0 ? '#4CAF50' : '#388E3C'} 
          />
          {index < snakePositions.length - 1 && (
            <SnakeConnector 
              startPos={pos}
              endPos={snakePositions[index + 1]}
              color="#388E3C"
            />
          )}
        </group>
      ))}
      <Food position={[foodPosition.x, foodPosition.y, foodPosition.z]} isBonus={isBonusFood} />
      <ambientLight intensity={0.8} />
      <pointLight position={[10, 10, 10]} intensity={1.2} />
      <pointLight position={[-10, 10, -10]} intensity={1.2} />
      <spotLight 
        position={[0, 15, 0]} 
        angle={0.5} 
        penumbra={0.5} 
        intensity={1.5}
        castShadow
      />
      <Ground />
      <Stars 
        radius={50} 
        depth={50} 
        count={2000} 
        factor={4} 
        saturation={0.5} 
        fade 
      />
    </>
  )
}

// Add new component for nickname input
function NicknameInput({ onSubmit }) {
  const [nickname, setNickname] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (nickname.trim()) {
      onSubmit(nickname.trim())
    }
  }

  return (
    <div className="nickname-screen">
      <form onSubmit={handleSubmit}>
        <h2>Enter Your Nickname</h2>
        <input
          type="text"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          placeholder="Enter nickname..."
          maxLength={15}
          required
        />
        <button type="submit">Start Game</button>
      </form>
    </div>
  )
}

function GameOverScreen({ score, onRestart }) {
  return (
    <div className="game-over-screen">
      <div className="game-over-content">
        <h2>Game Over!</h2>
        <p>Final Score: <span className="final-score">{score}</span></p>
        <button onClick={onRestart}>Play Again</button>
      </div>
    </div>
  )
}

function App() {
  const [showInstructions, setShowInstructions] = useState(true)
  const [score, setScore] = useState(0)
  const [nickname, setNickname] = useState('')
  const [gameStarted, setGameStarted] = useState(false)
  const [isGameOver, setIsGameOver] = useState(false)

  useEffect(() => {
    if (gameStarted && !isGameOver) {
      const timer = setTimeout(() => setShowInstructions(false), 5000)
      return () => clearTimeout(timer)
    }
  }, [gameStarted, isGameOver])

  const handleGameOver = (finalScore) => {
    setScore(finalScore)
    setIsGameOver(true)
  }

  const handleRestart = () => {
    setScore(0)
    setIsGameOver(false)
    setGameStarted(false)
  }

  const handleNicknameSubmit = (name) => {
    setNickname(name)
    setGameStarted(true)
    setIsGameOver(false)
  }

  if (!gameStarted) {
    return <NicknameInput onSubmit={handleNicknameSubmit} />
  }

  return (
    <div className="game-container">
      <div className="canvas-container">
        <Canvas 
          camera={{ 
            position: [0, 15, 15], 
            fov: 50,
            near: 0.1,
            far: 1000
          }}
          shadows
        >
          <color attach="background" args={['#1a1a2e']} />
          <Game onGameOver={handleGameOver} />
          <OrbitControls enableRotate={false} enableZoom={false} />
        </Canvas>
      </div>
      
      <div className="score-display">
        <div className="player-info">
          Player: <span className="nickname-value">{nickname}</span>
        </div>
        Score: <span className="score-value">{score}</span>
      </div>
      
      {showInstructions && !isGameOver && (
        <div className="instructions">
          <h2>Welcome {nickname}!</h2>
          <p>Use Arrow Keys to move</p>
          <p>Golden food gives +3 points!</p>
          <p>You can move through edges</p>
        </div>
      )}

      {isGameOver && <GameOverScreen score={score} onRestart={handleRestart} />}
    </div>
  )
}

export default App
