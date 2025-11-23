// components/ProjectCategorySelector.tsx
"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type ProjectCategory = {
  id: string;
  user_id: string | null;
  name: string;
  is_default: boolean;
};

interface ProjectCategorySelectorProps {
  userId: string;                  // from Supabase auth
  projectId: string;               // the project row id
  initialCategoryId?: string | null;
}

export const ProjectCategorySelector: React.FC<ProjectCategorySelectorProps> = ({
  userId,
  projectId,
  initialCategoryId,
}) => {
  const [categories, setCategories] = useState<ProjectCategory[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | "">(
    initialCategoryId || ""
  );
  const [newCategoryName, setNewCategoryName] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Load categories for this user (RLS will give defaults + user ones)
  useEffect(() => {
    const loadCategories = async () => {
      setErrorMsg(null);
      const { data, error } = await supabase
        .from("project_categories")
        .select("*")
        .order("name", { ascending: true });

      if (error) {
        console.error(error);
        setErrorMsg("Could not load categories");
        return;
      }

      setCategories((data || []) as ProjectCategory[]);
    };

    loadCategories();
  }, []);

  // Change category on the project
  const handleCategoryChange = async (categoryId: string) => {
    setSelectedCategoryId(categoryId);
    setErrorMsg(null);
    setLoading(true);

    const { error } = await supabase
      .from("projects")
      .update({ category_id: categoryId || null })
      .eq("id", projectId);

    if (error) {
      console.error(error);
      setErrorMsg("Failed to update project category");
    }

    setLoading(false);
  };

  // Create a new category then attach it to the project
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;

    setLoading(true);
    setErrorMsg(null);

    // 1. Insert the new category for this user
    const { data: inserted, error: insertError } = await supabase
      .from("project_categories")
      .insert({
        user_id: userId,
        name: newCategoryName.trim(),
        is_default: false,
      })
      .select("*")
      .single();

    if (insertError || !inserted) {
      console.error(insertError);
      setErrorMsg("Failed to create category");
      setLoading(false);
      return;
    }

    const newCat = inserted as ProjectCategory;

    // 2. Attach to the project
    const { error: updateError } = await supabase
      .from("projects")
      .update({ category_id: newCat.id })
      .eq("id", projectId);

    if (updateError) {
      console.error(updateError);
      setErrorMsg("Category created but not linked to project");
      setLoading(false);
      return;
    }

    // 3. Update UI
    setCategories((prev) => [...prev, newCat]);
    setSelectedCategoryId(newCat.id);
    setNewCategoryName("");
    setIsAdding(false);
    setLoading(false);
  };

  return (
    <div className="flex flex-col gap-2 max-w-sm">
      <label className="text-sm font-medium">Category</label>

      <div className="flex items-center gap-2">
        <select
          className="border rounded px-2 py-1 text-sm flex-1"
          value={selectedCategoryId}
          disabled={loading}
          onChange={(e) => handleCategoryChange(e.target.value)}
        >
          <option value="">No category</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>

        <button
          type="button"
          className="text-xs border rounded px-2 py-1 whitespace-nowrap"
          onClick={() => setIsAdding((prev) => !prev)}
          disabled={loading}
        >
          + Add category
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleAddCategory} className="flex gap-2 mt-1">
          <input
            type="text"
            className="border rounded px-2 py-1 text-sm flex-1"
            placeholder="New category name"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
          />
          <button
            type="submit"
            className="text-xs border rounded px-3 py-1"
            disabled={loading}
          >
            Save
          </button>
        </form>
      )}

      {errorMsg && (
        <p className="text-xs text-red-500 mt-1">{errorMsg}</p>
      )}
    </div>
  );
};
