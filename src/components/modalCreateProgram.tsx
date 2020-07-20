import { h, JSX } from "preact";
import { Button } from "./button";
import { Modal } from "./modal";
import { useRef } from "preact/hooks";

interface IProps {
  onSelect: (name: string) => void;
  onClose: () => void;
}

export function ModalCreateProgram(props: IProps): JSX.Element {
  const textInput = useRef<HTMLInputElement>(null);
  return (
    <Modal>
      <h3 className="pb-2 font-bold text-center">Create Program</h3>
      <input
        ref={textInput}
        className="block w-full px-4 py-2 leading-normal bg-white border border-gray-300 rounded-lg appearance-none focus:outline-none focus:shadow-outline"
        type="text"
        placeholder="Program Name"
        autofocus
      />
      <p className="mt-4 text-center">
        <Button type="button" kind="gray" className="mr-3" onClick={props.onClose}>
          Cancel
        </Button>
        <Button type="button" kind="green" className="mr-3" onClick={() => props.onSelect(textInput.current.value)}>
          Select
        </Button>
      </p>
    </Modal>
  );
}