import { useLocalSearchParams } from 'expo-router';

import { P5mFormScreen } from '../../../views';

export default function EditP5m() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <P5mFormScreen editId={id} />;
}
