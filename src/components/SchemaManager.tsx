import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TransliterationScheme } from "@/types/transliteration";
import { assameseScheme } from "@/data/assameseScheme";
import { useToast } from "@/hooks/use-toast";
import { PlusCircle, Copy, Download, Upload, Save, Trash2 } from "lucide-react"; // Import icons

const SchemaManager: React.FC<{
  onSchemaChange: (schema: TransliterationScheme) => void;
}> = ({ onSchemaChange }) => {
  const [schemas, setSchemas] = useState<TransliterationScheme[]>([assameseScheme]);
  const [selectedSchema, setSelectedSchema] = useState<TransliterationScheme>(assameseScheme);
  const [editingSchema, setEditingSchema] = useState<TransliterationScheme>(assameseScheme);
  const { toast } = useToast();

  useEffect(() => {
    const savedSchemas = localStorage.getItem("transliterationSchemas");
    if (savedSchemas) {
      setSchemas(JSON.parse(savedSchemas));
    }
  }, []);

  const createNewSchema = (fromScratch: boolean) => {
    const newSchema = fromScratch
      ? {
          name: "New Schema",
          consonants: {},
          vowels: {},
          vowelMarks: {},
          specialChar: {},
          isDefault: false,
        }
      : { ...selectedSchema, name: `Copy of ${selectedSchema.name}`, isDefault: false };
    setEditingSchema(newSchema);
  };

  const updateSchemaField = (category: keyof TransliterationScheme, key: string, value: string) => {
    setEditingSchema((prev) => ({
      ...prev,
      [category]: { ...(prev[category] as Record<string, string>), [key]: value },
    }));
  };

  const saveSchema = () => {
    const newSchemas = schemas.some((s) => s.name === editingSchema.name)
      ? schemas.map((s) => (s.name === editingSchema.name ? editingSchema : s))
      : [...schemas, editingSchema];
    setSchemas(newSchemas);
    setSelectedSchema(editingSchema);
    onSchemaChange(editingSchema);
    localStorage.setItem("transliterationSchemas", JSON.stringify(newSchemas));
    toast({
      title: "Schema Saved",
      description: `The schema "${editingSchema.name}" has been saved successfully.`,
    });
  };

  const exportSchema = () => {
    const dataStr =
      "data:text/json;charset=utf-8," +
      encodeURIComponent(JSON.stringify(selectedSchema));
    const downloadAnchorNode = document.createElement("a");
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", selectedSchema.name + ".json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const importSchema = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result;
        if (typeof content === "string") {
          try {
            const importedSchema = JSON.parse(content) as TransliterationScheme;
            let newName = importedSchema.name;
            let counter = 1;

            // Check for existing schema with the same name
            while (schemas.some(s => s.name === newName)) {
              newName = `${importedSchema.name} (Imported ${counter})`;
              counter++;
            }

            importedSchema.name = newName;
            importedSchema.isDefault = false;

            setSchemas(prevSchemas => [...prevSchemas, importedSchema]);
            setSelectedSchema(importedSchema);
            setEditingSchema(importedSchema);
            onSchemaChange(importedSchema);

            toast({
              title: "Schema Imported",
              description: newName === importedSchema.name
                ? `The schema "${newName}" has been imported successfully.`
                : `The schema has been imported as "${newName}" to avoid conflicts.`,
            });
          } catch (error) {
            console.error("Import error:", error);
            toast({
              title: "Import Failed",
              description: "The selected file is not a valid schema.",
              variant: "destructive",
            });
          }
        }
      };
      reader.readAsText(file);
    }
  };

  const deleteSchema = (schemaName: string) => {
    if (schemas.length === 1) {
      toast({
        title: "Cannot Delete",
        description: "You must have at least one schema.",
        variant: "destructive",
      });
      return;
    }
    const newSchemas = schemas.filter((s) => s.name !== schemaName);
    setSchemas(newSchemas);
    const newSelectedSchema = newSchemas[0];
    setSelectedSchema(newSelectedSchema);
    setEditingSchema(newSelectedSchema);
    onSchemaChange(newSelectedSchema);
    localStorage.setItem("transliterationSchemas", JSON.stringify(newSchemas));
    toast({
      title: "Schema Deleted",
      description: `The schema "${schemaName}" has been deleted.`,
    });
  };

  const deleteSchemaField = (category: keyof TransliterationScheme, key: string) => {
    setEditingSchema((prev) => {
      const newCategory = { ...prev[category] as Record<string, string> };
      delete newCategory[key];
      return { ...prev, [category]: newCategory };
    });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Schema Selection</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select
            value={selectedSchema.name}
            onValueChange={(value) => {
              const schema = schemas.find((s) => s.name === value);
              if (schema) {
                setSelectedSchema(schema);
                setEditingSchema(schema);
                onSchemaChange(schema);
              }
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a schema" />
            </SelectTrigger>
            <SelectContent>
              {schemas.map((schema) => (
                <SelectItem key={schema.name} value={schema.name}>
                  {schema.name}
                  {schema.isDefault && (
                    <span className="ml-2 text-green-500 italic text-sm">(default)</span>
                  )}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <div className="flex justify-between">
            <Button onClick={() => {
              createNewSchema(true);
              toast({ title: "New Schema Created", description: "A new blank schema has been created." });
            }}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Create New Schema
            </Button>
            <Button onClick={() => {
              createNewSchema(false);
              toast({ title: "Schema Copied", description: `A copy of "${selectedSchema.name}" has been created.` });
            }} variant="outline">
              <Copy className="mr-2 h-4 w-4" />
              Copy Selected
            </Button>
          </div>
          
          <div className="flex justify-between">
            <Button onClick={exportSchema} variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export Schema
            </Button>
            <label htmlFor="import-schema" className="cursor-pointer">
              <Button variant="outline" asChild>
                <span>
                  <Upload className="mr-2 h-4 w-4" />
                  Import Schema
                </span>
              </Button>
              <Input
                id="import-schema"
                type="file"
                onChange={importSchema}
                accept=".json"
                className="hidden"
              />
            </label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Edit Schema: {editingSchema.name}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="Schema Name"
            value={editingSchema.name}
            onChange={(e) => setEditingSchema({ ...editingSchema, name: e.target.value })}
            disabled={editingSchema.isDefault}
          />

          {!editingSchema.isDefault && (
            <Button onClick={() => deleteSchema(editingSchema.name)} variant="destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Schema
            </Button>
          )}

          {(["consonants", "vowels", "vowelMarks", "specialChar"] as const).map((category) => (
            <Card key={category}>
              <CardHeader>
                <CardTitle className="capitalize">{category}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(editingSchema[category]).map(([key, value]) => (
                    <div key={key} className="flex space-x-2">
                      <Input
                        value={key}
                        onChange={(e) => {
                          const newCategory = { ...editingSchema[category] };
                          delete newCategory[key];
                          newCategory[e.target.value] = value;
                          updateSchemaField(category, e.target.value, value);
                        }}
                        placeholder="Key"
                        disabled={editingSchema.isDefault}
                      />
                      <Input
                        value={value}
                        onChange={(e) => updateSchemaField(category, key, e.target.value)}
                        placeholder="Value"
                        disabled={editingSchema.isDefault}
                      />
                      {!editingSchema.isDefault && (
                        <Button onClick={() => deleteSchemaField(category, key)} variant="destructive" size="icon">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
                {!editingSchema.isDefault && (
                  <Button
                    onClick={() => updateSchemaField(category, "", "")}
                    className="mt-2"
                  >
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add {category.slice(0, -1)}
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}

          {!editingSchema.isDefault && (
            <Button onClick={saveSchema}>
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SchemaManager;
