import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { vi, beforeEach, describe, it, expect } from 'vitest'
import PlayPage from '../pages/PlayPage'
import '@testing-library/jest-dom'

// 1. Mockeamos el componente Board para aislar la prueba de PlayPage.
// Así evitamos que Board intente hacer llamadas a la API (fetch) durante este test.
vi.mock('../components/Board', () => ({
  Board: () => <div data-testid="mock-board">Tablero Simulado</div>
}))

// También mockeamos las RUTAS por si cambian en el futuro, pero aquí usamos
// valores simples para asegurar la prueba.
vi.mock('../routes/constants', () => ({
  ROUTES: {
    GAME_PATH: (username: string) => `/game/${username}`
  }
}))

describe('Pruebas unitarias de la página de Partida (PlayPage)', () => {

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('debería extraer el nombre de usuario de la URL y mostrarlo en el título', async () => {
    render(
      // Simulamos que el usuario "Carlos" ha entrado en la URL de la partida
      <MemoryRouter initialEntries={['/play/Carlos']}>
        <Routes>
          <Route path="/play/:username" element={<PlayPage />} />
        </Routes>
      </MemoryRouter>
    )

    // Comprobamos que el nombre aparece en la cabecera
    expect(await screen.findByText('Carlos')).toBeTruthy()
    expect(await screen.findByText(/Partida de:/i)).toBeTruthy()
  })

  it('debería renderizar el componente Board (Tablero)', async () => {
    render(
      <MemoryRouter initialEntries={['/play/Carlos']}>
        <Routes>
          <Route path="/play/:username" element={<PlayPage />} />
        </Routes>
      </MemoryRouter>
    )

    // Buscamos nuestro tablero "mockeado"
    expect(await screen.findByTestId('mock-board')).toBeTruthy()
  })

  it('debería navegar de vuelta al Lobby al pulsar "Abandonar Partida"', async () => {
    render(
      <MemoryRouter initialEntries={['/play/Carlos']}>
        <Routes>
          {/* Ruta actual de la partida */}
          <Route path="/play/:username" element={<PlayPage />} />
          {/* Ruta ficticia del Lobby para comprobar si la navegación funciona */}
          <Route path="/game/:username" element={<div data-testid="lobby-page">Página de Lobby</div>} />
        </Routes>
      </MemoryRouter>
    )

    // Buscamos el botón de abandonar
    const abandonButton = await screen.findByRole('button', { name: /Abandonar Partida/i })
    expect(abandonButton).toBeTruthy()

    // Hacemos clic en el botón
    fireEvent.click(abandonButton)

    // Esperamos que la URL haya cambiado y ahora estemos viendo el componente ficticio del Lobby
    await waitFor(() => {
      expect(screen.getByTestId('lobby-page')).toBeTruthy()
    })
  })
})