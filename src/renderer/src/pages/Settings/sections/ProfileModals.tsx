import { EntityMetadata } from "@/common/schemas";
import { APP_EVENTS } from "@/common/types";
import { Field, Input, Modal, Select } from "@/components";
import { useState } from "react";

export function NewProfileModal({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState("");

  return (
    <Modal
      title="Create New Profile"
      description="Enter a name for your new streamer profile. This will start with completely blank settings."
      confirmText="Create Profile"
      onClose={onClose}
      onConfirm={() => {
        if (!name.trim()) return;
        window.api.emit(APP_EVENTS.CREATE_PROFILE, { name });
        onClose();
      }}
    >
      <Field label="Profile Name">
        <Input
          placeholder="e.g. Chill Stream"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
        />
      </Field>
    </Modal>
  );
}

type CloneProps = {
  profiles: EntityMetadata[];
  // Cloned unless another profile is picked
  active: EntityMetadata;
  onClose: () => void;
};

export function CloneProfileModal({ profiles, active, onClose }: CloneProps) {
  const [ref, setRef] = useState(active.file);
  const [name, setName] = useState("");

  return (
    <Modal
      title="Clone Existing Profile"
      description="Select an existing profile to copy its settings, and give the new clone a name."
      confirmText="Clone Profile"
      onClose={onClose}
      onConfirm={() => {
        if (!name.trim()) return;
        window.api.emit(APP_EVENTS.CLONE_PROFILE, { name, ref });
        onClose();
      }}
    >
      <Field label="Profile to Clone">
        <Select
          options={profiles.map((p) => ({ label: p.name, value: p.file }))}
          value={ref}
          onChange={setRef}
        />
      </Field>
      <Field label="New Profile Name">
        <Input
          placeholder="e.g. Horror Stream Layout"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </Field>
    </Modal>
  );
}
