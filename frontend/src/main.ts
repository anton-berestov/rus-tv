import axios from 'axios'
import { createPinia } from 'pinia'
import { createApp } from 'vue'
import App from './App.vue'
import './assets/main.css'
import router from './router'
import { useAuthStore } from './stores/auth'

// Настройка базового URL для axios
axios.defaults.baseURL = 'http://localhost:3000'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

// Инициализация store авторизации и монтирование приложения
const authStore = useAuthStore(pinia)
authStore.init().finally(() => {
	app.mount('#app')
})
