<template>
  <div class="animation-container" @mousemove="handleMouseMove">
    <div 
      v-for="(particle, index) in particles" 
      :key="index"
      :style="getParticleStyle(particle)"
      class="particle"
    ></div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onBeforeUnmount } from 'vue'

const container = ref(null)
const particles = reactive([])
const particleCount = 100

// 创建粒子
const createParticles = () => {
  for (let i = 0; i < particleCount; i++) {
    particles.push({
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 3 + 1,
      speedX: (Math.random() - 0.5) * 0.5,
      speedY: (Math.random() - 0.5) * 0.5,
      color: `hsla(${Math.random() * 360}, 70%, 60%, ${Math.random() * 0.8 + 0.2})`
    })
  }
}

// 更新粒子位置
const updateParticles = () => {
  particles.forEach(particle => {
    particle.x += particle.speedX
    particle.y += particle.speedY
    
    if (particle.x < 0 || particle.x > 100) particle.speedX *= -1
    if (particle.y < 0 || particle.y > 100) particle.speedY *= -1
  })
  
  requestAnimationFrame(updateParticles)
}

// 鼠标交互
const handleMouseMove = (e) => {
  const rect = e.currentTarget.getBoundingClientRect()
  const mouseX = e.clientX - rect.left
  const mouseY = e.clientY - rect.top
  
  particles.forEach(particle => {
    const dx = mouseX / rect.width * 100 - particle.x
    const dy = mouseY / rect.height * 100 - particle.y
    const distance = Math.sqrt(dx * dx + dy * dy)
    
    if (distance < 20) {
      particle.x += dx * 0.01
      particle.y += dy * 0.01
    }
  })
}

// 获取粒子样式
const getParticleStyle = (particle) => {
  return {
    left: `${particle.x}%`,
    top: `${particle.y}%`,
    width: `${particle.size}px`,
    height: `${particle.size}px`,
    backgroundColor: particle.color,
    boxShadow: `0 0 ${particle.size * 2}px ${particle.color}`
  }
}

onMounted(() => {
  createParticles()
  updateParticles()
})

onBeforeUnmount(() => {
  // 清理工作
})
</script>

<style scoped>
.animation-container {
  width: 100%;
  height: 200px;
  overflow: hidden;
  position: relative;
  background-color: #0a0a1a;
}

.particle {
  position: absolute;
  border-radius: 50%;
  transition: all 0.1s ease-out;
}
</style>  