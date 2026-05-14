"use client"

import { useRouter } from "next/navigation"

import { ProtectedRoute } from "@/components/auth/protected-route"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuthContext } from "@/contexts/auth-context"

export default function SalesPage() {
  const router = useRouter()
  const { logoutUser, userName } = useAuthContext()

  return (
    <ProtectedRoute>
      <div className="mx-auto mt-10 max-w-2xl px-4">
        <Card>
          <CardHeader>
            <CardTitle>Sales Workspace</CardTitle>
            <CardDescription>Scaffold route for future sales dashboard modules.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">Logged in as: {userName ?? "Sales User"}</p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => router.push("/admin")}>
                Try Admin Route
              </Button>
              <Button
                onClick={() => {
                  logoutUser()
                  router.replace("/login")
                }}
              >
                Logout
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  )
}
