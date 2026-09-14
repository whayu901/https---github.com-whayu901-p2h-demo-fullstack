import { Stack } from 'expo-router';

import { useRetentionOnStartup } from '../controllers';
import { DatabaseProvider } from '../models';
import { colors } from '../views/theme';

/** Runs startup-only controllers (retention sweep) once the database is ready, then renders the Stack. */
function AppNavigator() {
  useRetentionOnStartup();

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.charcoal,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'P2H & P5M' }} />
      <Stack.Screen name="p2h/new" options={{ title: 'P2H — Pemeriksaan Harian' }} />
      <Stack.Screen name="p2h/[id]/edit" options={{ title: 'Ubah P2H' }} />
      <Stack.Screen name="p5m/new" options={{ title: 'P5M — Safety Talk' }} />
      <Stack.Screen name="p5m/[id]/edit" options={{ title: 'Ubah P5M' }} />
      <Stack.Screen name="history/index" options={{ title: 'Riwayat' }} />
      <Stack.Screen name="history/[kind]/[id]" options={{ title: 'Detail' }} />
      <Stack.Screen name="pengaturan" options={{ title: 'Pengaturan' }} />
    </Stack>
  );
}

/** Root layout: opens/migrates the local database, then renders the Stack navigator. */
export default function RootLayout() {
  return (
    <DatabaseProvider>
      <AppNavigator />
    </DatabaseProvider>
  );
}
