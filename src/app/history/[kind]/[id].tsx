import { useLocalSearchParams } from 'expo-router';
import { Text } from 'react-native';

import type { RecordKind } from '../../../controllers';
import { DetailScreen } from '../../../views';
import { ScreenContainer } from '../../../views/components';

function isRecordKind(value: string): value is RecordKind {
  return value === 'p2h' || value === 'p5m';
}

export default function HistoryDetail() {
  const { kind, id } = useLocalSearchParams<{ kind: string; id: string }>();

  if (!isRecordKind(kind)) {
    return (
      <ScreenContainer>
        <Text>Jenis data tidak dikenal.</Text>
      </ScreenContainer>
    );
  }

  return <DetailScreen kind={kind} id={id} />;
}
