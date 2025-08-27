<template>
  <div class="background-animation">
    <div class="shape shape-1"></div>
    <div class="shape shape-2"></div>
    <div class="shape shape-3"></div>
  </div>
</template>

<style scoped>
.background-animation {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  z-index: 0;
}

.shape {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  animation: float 20s infinite ease-in-out;
}

.shape-1 {
  width: 300px;
  height: 300px;
  top: 10%;
  left: 10%;
  animation-delay: 0s;
}

.shape-2 {
  width: 200px;
  height: 200px;
  top: 60%;
  right: 15%;
  animation-delay: 7s;
}

.shape-3 {
  width: 150px;
  height: 150px;
  bottom: 20%;
  left: 60%;
  animation-delay: 14s;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0px) rotate(0deg);
    opacity: 0.7;
  }
  33% {
    transform: translateY(-30px) rotate(120deg);
    opacity: 0.9;
  }
  66% {
    transform: translateY(-60px) rotate(240deg);
    opacity: 0.8;
  }
}
</style>