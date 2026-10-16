import { Profile } from "@/common/schemas";
import { Field, FormGrid, Input, ListTextarea } from "@/components";
import { Updater } from "@/hooks";

type Protection = Profile["tts"]["protection"];

interface Props {
  protection: Protection;
  update: Updater<Protection>;
}

/**
 * TTS only protection settings, shown under the shared ones.
 */
export function ProtectionFields({ protection, update }: Props) {
  return (
    <>
      <FormGrid>
        <Field label="Max Comment Length" hint="(characters)">
          <Input
            type="number"
            value={protection.comment_length}
            onChange={(e) =>
              update((p) => {
                p.comment_length = Number(e.target.value);
              })
            }
          />
        </Field>
      </FormGrid>

      <Field label="Banned Words Filter" hint="(comma separated)">
        <ListTextarea
          placeholder="word1, word2, word3..."
          value={protection.banned}
          onChange={(banned) =>
            update((p) => {
              p.banned = banned;
            })
          }
        />
      </Field>
    </>
  );
}
