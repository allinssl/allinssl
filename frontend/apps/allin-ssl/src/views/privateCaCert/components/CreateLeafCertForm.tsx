import { defineComponent } from "vue";
import { useCreateLeafCertController } from "../useController";
import type { IntermediateCa } from "../types";

export default defineComponent({
	name: "CreateLeafCertForm",
	props: {
		list: {
			type: Array as () => IntermediateCa[],
			default: () => [],
		},
	},
	setup(props) {
    const { CreateLeafCertForm } = useCreateLeafCertController(props.list);
    return () => <CreateLeafCertForm labelPlacement="top" />;
  },
});
