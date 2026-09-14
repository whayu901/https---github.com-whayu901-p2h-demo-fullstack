import { useLocalSearchParams } from 'expo-router';

import { P2hFormScreen } from '../../../views';

export default function EditP2h() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <P2hFormScreen editId={id} />;
}
