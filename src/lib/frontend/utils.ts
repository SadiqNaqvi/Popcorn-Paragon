import { InputFrame } from "@type/schemas";

export const objectToFormData = (
  object: Record<string, any>
): FormData | null => {

  const formData = new FormData();
  if (!object) return formData;

  Object.keys(object).forEach((key) => {

    if (key === "files" && Array.isArray(object.files) && object.files.length)
      object.files.forEach((file) => formData.append("files", file));

    else if (object[key] !== undefined) formData.append(key, JSON.stringify(object[key]));
  });

  return formData;
};


export const readyFrames = async (
  input: InputFrame | InputFrame[],
  fileName?: string
): Promise<{ files: File[]; filesData: Omit<InputFrame, "blob">[] }> => {

  const frames = Array.isArray(input) ? input : [input];

  if (!frames || !frames?.length) return { files: [], filesData: [] };

  const promises = frames.map(async ({ blob, ...data }) => {

    if (!data.shouldUpload || !blob) return { data };

    // const arrayBuffer = await blob.arrayBuffer();

    const file = new File([blob], fileName ?? "Parlocula", {
      type: blob.type,
    });

    return { file, data };

  });

  const results = await Promise.all(promises);

  const files = results.filter((res) => !!res.file).map((res) => res.file);
  const filesData = results.map((res) => res.data);

  return { files, filesData };
};

export const checkEditedFields = <T extends Record<string, any>>(oldObj: T, newObj: Partial<T>): Partial<T> => {
  const objToReturn: Record<string, any> = {};
  Object.entries(newObj).forEach(([k, v]) => {
    if (v instanceof File) return;
    else if (JSON.stringify(oldObj[k]) === JSON.stringify(newObj[k])) return;
    objToReturn[k] = v;
  });

  return objToReturn as Partial<T>;
}