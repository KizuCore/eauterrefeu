export { }

declare global {
    interface Window {
        electronAPI: {
            onUpdateReady: (callback: () => void) => void
        }
    }
}
