/**
 * EJEMPLOS DE CÓDIGO PARA FRONTEND
 * Sistema de Skills con Sincronización Automática
 * 
 * Estos son ejemplos de cómo usar la API de skills en tu frontend.
 * La sincronización con equipos es AUTOMÁTICA - no requiere código adicional.
 */

// ============================================================================
// 1. SERVICIO DE SKILLS (API Wrapper)
// ============================================================================

/**
 * Servicio para gestionar skills de usuarios
 */
class SkillsService {
  private baseUrl: string = '/api'; // Ajustar según tu configuración

  /**
   * Agregar skill a usuario
   * ✅ Se propaga automáticamente a todos los equipos del usuario
   */
  async addSkillToUser(userId: string, skillId: string, level: number) {
    const response = await fetch(`${this.baseUrl}/users/${userId}/skills`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Agregar headers de autenticación si es necesario
      },
      body: JSON.stringify({ skillId, level })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al agregar skill');
    }

    return response.json();
  }

  /**
   * Actualizar nivel de skill
   * ⚠️ Solo actualiza el usuario, NO afecta equipos
   */
  async updateSkillLevel(userId: string, skillId: string, level: number) {
    const response = await fetch(`${this.baseUrl}/users/${userId}/skills/${skillId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ level })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al actualizar skill');
    }

    return response.json();
  }

  /**
   * Eliminar skill de usuario
   * ✅ Se elimina automáticamente de equipos si ningún otro miembro la tiene
   */
  async removeSkillFromUser(userId: string, skillId: string) {
    const response = await fetch(`${this.baseUrl}/users/${userId}/skills/${skillId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al eliminar skill');
    }

    // 204 No Content - no hay body
    return;
  }

  /**
   * Obtener skills de usuario
   */
  async getUserSkills(userId: string) {
    const response = await fetch(`${this.baseUrl}/users/${userId}`);
    
    if (!response.ok) {
      throw new Error('Error al obtener usuario');
    }

    const user = await response.json();
    return user.skills || [];
  }

  /**
   * Obtener todas las skills disponibles
   */
  async getAllSkills() {
    const response = await fetch(`${this.baseUrl}/skills`);
    
    if (!response.ok) {
      throw new Error('Error al obtener skills');
    }

    const data = await response.json();
    return data.data || [];
  }
}

// ============================================================================
// 2. COMPONENTE REACT - Gestión de Skills de Usuario
// ============================================================================

import React, { useState, useEffect } from 'react';

interface Skill {
  id: string;
  name: string;
  category?: string;
}

interface UserSkill {
  id: string;
  skillId: string;
  level: number;
  skill: Skill;
}

interface UserSkillsManagerProps {
  userId: string;
}

export function UserSkillsManager({ userId }: UserSkillsManagerProps) {
  const [userSkills, setUserSkills] = useState<UserSkill[]>([]);
  const [allSkills, setAllSkills] = useState<Skill[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSkill, setSelectedSkill] = useState<string>('');
  const [selectedLevel, setSelectedLevel] = useState<number>(3);

  const skillsService = new SkillsService();

  // Cargar datos iniciales
  useEffect(() => {
    loadData();
  }, [userId]);

  async function loadData() {
    setIsLoading(true);
    try {
      const [skills, allSkillsList] = await Promise.all([
        skillsService.getUserSkills(userId),
        skillsService.getAllSkills()
      ]);
      setUserSkills(skills);
      setAllSkills(allSkillsList);
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setIsLoading(false);
    }
  }

  // Agregar skill
  async function handleAddSkill() {
    if (!selectedSkill) return;

    try {
      setIsLoading(true);
      await skillsService.addSkillToUser(userId, selectedSkill, selectedLevel);
      
      // ✅ Skill agregada y sincronizada con equipos automáticamente
      alert('Skill agregada y sincronizada con tus equipos');
      
      // Recargar skills
      await loadData();
      setSelectedSkill('');
      setSelectedLevel(3);
    } catch (error) {
      alert(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  }

  // Actualizar nivel
  async function handleUpdateLevel(skillId: string, newLevel: number) {
    try {
      await skillsService.updateSkillLevel(userId, skillId, newLevel);
      
      // Actualizar localmente
      setUserSkills(prev => 
        prev.map(s => s.skillId === skillId ? { ...s, level: newLevel } : s)
      );
    } catch (error) {
      alert(`Error: ${error.message}`);
    }
  }

  // Eliminar skill
  async function handleRemoveSkill(skillId: string) {
    if (!confirm('¿Seguro que quieres eliminar esta skill?')) return;

    try {
      setIsLoading(true);
      await skillsService.removeSkillFromUser(userId, skillId);
      
      // ✅ Skill eliminada y limpiada de equipos automáticamente
      alert('Skill eliminada');
      
      // Actualizar localmente
      setUserSkills(prev => prev.filter(s => s.skillId !== skillId));
    } catch (error) {
      alert(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  }

  // Skills disponibles (que el usuario aún no tiene)
  const availableSkills = allSkills.filter(
    skill => !userSkills.some(us => us.skillId === skill.id)
  );

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Mis Skills</h2>

      {/* Información sobre sincronización */}
      <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-4">
        <p className="text-sm text-blue-800">
          ℹ️ Las skills se sincronizan automáticamente con tus equipos
        </p>
      </div>

      {/* Agregar nueva skill */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2">Agregar Skill</h3>
        <div className="flex gap-2">
          <select
            value={selectedSkill}
            onChange={(e) => setSelectedSkill(e.target.value)}
            className="flex-1 border rounded px-3 py-2"
            disabled={isLoading}
          >
            <option value="">Selecciona una skill...</option>
            {availableSkills.map(skill => (
              <option key={skill.id} value={skill.id}>
                {skill.name}
              </option>
            ))}
          </select>

          <select
            value={selectedLevel}
            onChange={(e) => setSelectedLevel(Number(e.target.value))}
            className="border rounded px-3 py-2"
            disabled={isLoading}
          >
            <option value="1">Nivel 1 - Básico</option>
            <option value="2">Nivel 2 - Intermedio</option>
            <option value="3">Nivel 3 - Competente</option>
            <option value="4">Nivel 4 - Avanzado</option>
            <option value="5">Nivel 5 - Experto</option>
          </select>

          <button
            onClick={handleAddSkill}
            disabled={!selectedSkill || isLoading}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-gray-300"
          >
            Agregar
          </button>
        </div>
      </div>

      {/* Lista de skills del usuario */}
      <div>
        <h3 className="text-lg font-semibold mb-2">
          Tus Skills ({userSkills.length})
        </h3>
        
        {userSkills.length === 0 ? (
          <p className="text-gray-500">No tienes skills agregadas aún</p>
        ) : (
          <div className="space-y-2">
            {userSkills.map(userSkill => (
              <div
                key={userSkill.id}
                className="flex items-center gap-3 p-3 border rounded"
              >
                <div className="flex-1">
                  <span className="font-medium">{userSkill.skill.name}</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">Nivel:</span>
                  <select
                    value={userSkill.level}
                    onChange={(e) => handleUpdateLevel(
                      userSkill.skillId,
                      Number(e.target.value)
                    )}
                    className="border rounded px-2 py-1 text-sm"
                  >
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                    <option value="4">4</option>
                    <option value="5">5</option>
                  </select>
                </div>

                <button
                  onClick={() => handleRemoveSkill(userSkill.skillId)}
                  className="text-red-500 hover:text-red-700 px-3 py-1"
                  disabled={isLoading}
                >
                  Eliminar
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// 3. COMPONENTE REACT - Agregar Miembro a Equipo
// ============================================================================

interface TeamMemberInviteProps {
  teamId: string;
  onMemberAdded?: () => void;
}

export function TeamMemberInvite({ teamId, onMemberAdded }: TeamMemberInviteProps) {
  const [userId, setUserId] = useState('');
  const [role, setRole] = useState('MIEMBRO');
  const [isLoading, setIsLoading] = useState(false);

  async function handleAddMember() {
    if (!userId) return;

    try {
      setIsLoading(true);
      
      const response = await fetch(`/api/teams/${teamId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error);
      }

      const member = await response.json();
      
      // ✅ Miembro agregado y sus skills copiadas al equipo automáticamente
      alert(
        `Miembro agregado exitosamente. ` +
        `${member.skillsCopied || 0} skills agregadas al equipo.`
      );

      setUserId('');
      onMemberAdded?.();
    } catch (error) {
      alert(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="p-4 border rounded">
      <h3 className="text-lg font-semibold mb-3">Agregar Miembro</h3>
      
      <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-4">
        <p className="text-sm text-blue-800">
          ℹ️ Las skills del miembro se copiarán automáticamente al equipo
        </p>
      </div>

      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium mb-1">
            ID de Usuario
          </label>
          <input
            type="text"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            placeholder="Ingresa el ID del usuario"
            className="w-full border rounded px-3 py-2"
            disabled={isLoading}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Rol
          </label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full border rounded px-3 py-2"
            disabled={isLoading}
          >
            <option value="MIEMBRO">Miembro</option>
            <option value="LIDER">Líder</option>
          </select>
        </div>

        <button
          onClick={handleAddMember}
          disabled={!userId || isLoading}
          className="w-full bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:bg-gray-300"
        >
          {isLoading ? 'Agregando...' : 'Agregar Miembro'}
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// 4. HOOK PERSONALIZADO - useUserSkills
// ============================================================================

import { useState, useEffect } from 'react';

/**
 * Hook personalizado para gestionar skills de usuario
 */
export function useUserSkills(userId: string) {
  const [skills, setSkills] = useState<UserSkill[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const skillsService = new SkillsService();

  // Cargar skills
  async function loadSkills() {
    setIsLoading(true);
    setError(null);
    try {
      const data = await skillsService.getUserSkills(userId);
      setSkills(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }

  // Agregar skill
  async function addSkill(skillId: string, level: number) {
    setIsLoading(true);
    setError(null);
    try {
      const newSkill = await skillsService.addSkillToUser(userId, skillId, level);
      setSkills(prev => [...prev, newSkill]);
      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setIsLoading(false);
    }
  }

  // Actualizar nivel
  async function updateLevel(skillId: string, level: number) {
    setIsLoading(true);
    setError(null);
    try {
      await skillsService.updateSkillLevel(userId, skillId, level);
      setSkills(prev =>
        prev.map(s => s.skillId === skillId ? { ...s, level } : s)
      );
      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setIsLoading(false);
    }
  }

  // Eliminar skill
  async function removeSkill(skillId: string) {
    setIsLoading(true);
    setError(null);
    try {
      await skillsService.removeSkillFromUser(userId, skillId);
      setSkills(prev => prev.filter(s => s.skillId !== skillId));
      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (userId) {
      loadSkills();
    }
  }, [userId]);

  return {
    skills,
    isLoading,
    error,
    addSkill,
    updateLevel,
    removeSkill,
    reload: loadSkills
  };
}

// Ejemplo de uso del hook:
/*
function MyComponent() {
  const userId = "current-user-id";
  const { skills, isLoading, addSkill, removeSkill } = useUserSkills(userId);

  async function handleAdd() {
    const result = await addSkill("skill-id", 4);
    if (result.success) {
      alert("Skill agregada y sincronizada con equipos");
    }
  }

  return (
    <div>
      {skills.map(skill => (
        <div key={skill.id}>
          {skill.skill.name} - Nivel {skill.level}
          <button onClick={() => removeSkill(skill.skillId)}>Eliminar</button>
        </div>
      ))}
    </div>
  );
}
*/

// ============================================================================
// 5. FUNCIONES HELPER
// ============================================================================

/**
 * Formatea el nivel de skill como texto
 */
export function formatSkillLevel(level: number): string {
  const levels = {
    1: 'Básico',
    2: 'Intermedio',
    3: 'Competente',
    4: 'Avanzado',
    5: 'Experto'
  };
  return levels[level] || 'Desconocido';
}

/**
 * Obtiene el color para el nivel de skill
 */
export function getSkillLevelColor(level: number): string {
  const colors = {
    1: 'bg-gray-100 text-gray-800',
    2: 'bg-blue-100 text-blue-800',
    3: 'bg-green-100 text-green-800',
    4: 'bg-yellow-100 text-yellow-800',
    5: 'bg-red-100 text-red-800'
  };
  return colors[level] || 'bg-gray-100 text-gray-800';
}

/**
 * Agrupa skills por categoría
 */
export function groupSkillsByCategory(skills: UserSkill[]): Record<string, UserSkill[]> {
  return skills.reduce((acc, skill) => {
    const category = skill.skill.category || 'Sin categoría';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(skill);
    return acc;
  }, {} as Record<string, UserSkill[]>);
}

// ============================================================================
// 6. COMPONENTE BONUS - Badge de Skill
// ============================================================================

interface SkillBadgeProps {
  name: string;
  level?: number;
  onRemove?: () => void;
  showLevel?: boolean;
}

export function SkillBadge({ name, level, onRemove, showLevel = false }: SkillBadgeProps) {
  return (
    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm ${
      level ? getSkillLevelColor(level) : 'bg-blue-100 text-blue-800'
    }`}>
      <span>{name}</span>
      {showLevel && level && (
        <span className="text-xs opacity-75">
          (Nv. {level})
        </span>
      )}
      {onRemove && (
        <button
          onClick={onRemove}
          className="ml-1 hover:bg-black hover:bg-opacity-10 rounded-full p-0.5"
        >
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      )}
    </span>
  );
}

// Uso del componente:
/*
<SkillBadge 
  name="React" 
  level={4} 
  showLevel 
  onRemove={() => handleRemove('skill-id')}
/>
*/

export default {
  SkillsService,
  UserSkillsManager,
  TeamMemberInvite,
  useUserSkills,
  SkillBadge,
  formatSkillLevel,
  getSkillLevelColor,
  groupSkillsByCategory
};
