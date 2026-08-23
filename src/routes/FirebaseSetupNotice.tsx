import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import logo from '@/assets/brand/logo-lockup-light-bg.png'

export function FirebaseSetupNotice() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="items-center text-center">
          <img src={logo} alt="Ingroma" className="mb-4 h-10 w-auto" />
          <CardTitle>Falta configurar Firebase</CardTitle>
          <CardDescription>
            Completá las variables <code className="rounded bg-muted px-1 py-0.5 text-xs">VITE_FIREBASE_*</code> en
            un archivo <code className="rounded bg-muted px-1 py-0.5 text-xs">.env</code> (mirá{' '}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">.env.example</code>) y reiniciá el servidor.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Encontrás estos valores en la consola de Firebase: Configuración del proyecto → Tus apps → SDK setup and
          configuration.
        </CardContent>
      </Card>
    </div>
  )
}
