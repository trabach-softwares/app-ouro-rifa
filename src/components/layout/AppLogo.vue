<template>
  <component :is="tag" :to="to" :class="['app-logo', size, { link: isLink }]">
    <div class="logo-icon">
      <img src="@/assets/logo.png" alt="Ouro Rifa Logo" />
    </div>
    <span v-if="showText" class="logo-text">{{ text }}</span>
  </component>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  size: {
    type: String,
    default: 'medium', // small, medium, large
    validator: (value) => ['small', 'medium', 'large'].includes(value)
  },
  showText: {
    type: Boolean,
    default: true
  },
  text: {
    type: String,
    default: 'Ouro Rifa'
  },
  to: {
    type: String,
    default: null
  },
  tag: {
    type: String,
    default: 'div'
  }
})

const isLink = computed(() => props.to !== null)
const tag = computed(() => isLink.value ? 'router-link' : props.tag)
</script>

<style scoped>
.app-logo {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 800;
  color: #4f46e5;
}

.app-logo.link {
  text-decoration: none;
  transition: color 0.2s ease;
}

.app-logo.link:hover {
  color: #3730a3;
}

.logo-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.logo-icon img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

/* Tamanhos */
.app-logo.small .logo-icon {
  width: 24px;
  height: 24px;
  padding: 4px;
}

.app-logo.small .logo-text {
  font-size: 1rem;
}

.app-logo.medium .logo-icon {
  width: 32px;
  height: 32px;
  padding: 6px;
}

.app-logo.medium .logo-text {
  font-size: 1.25rem;
}

.app-logo.large .logo-icon {
  width: 48px;
  height: 48px;
  padding: 8px;
}

.app-logo.large .logo-text {
  font-size: 1.5rem;
}
</style>