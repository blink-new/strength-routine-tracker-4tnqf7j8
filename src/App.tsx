import { useState, useEffect, useCallback } from 'react'
import { blink } from './blink/client'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card'
import { Button } from './components/ui/button'
import { Input } from './components/ui/input'
import { Label } from './components/ui/label'
import { Badge } from './components/ui/badge'
import { Separator } from './components/ui/separator'
import { Plus, Dumbbell, TrendingUp, Calendar } from 'lucide-react'
import { useToast } from './hooks/use-toast'
import { Toaster } from './components/ui/toaster'

interface Exercise {
  id: string
  user_id: string
  exercise_name: string
  category: 'upper' | 'lower'
  reps: number
  sets: number
  total_weight: number
  created_at: string
}

interface User {
  id: string
  email: string
}

function App() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [activeTab, setActiveTab] = useState<'upper' | 'lower'>('upper')
  const [showAddForm, setShowAddForm] = useState(false)
  const [formData, setFormData] = useState({
    exercise_name: '',
    reps: '',
    sets: '',
    total_weight: ''
  })
  const { toast } = useToast()

  const loadExercises = useCallback(async () => {
    if (!user) return
    try {
      const data = await blink.db.exercises.list({
        where: { user_id: user.id },
        orderBy: { created_at: 'desc' }
      })
      setExercises(data)
    } catch (error) {
      console.error('Failed to load exercises:', error)
      toast({
        title: "Error",
        description: "Failed to load exercises",
        variant: "destructive"
      })
    }
  }, [user, toast])

  useEffect(() => {
    const unsubscribe = blink.auth.onAuthStateChanged((state) => {
      setUser(state.user)
      setLoading(state.isLoading)
    })
    return unsubscribe
  }, [])

  useEffect(() => {
    if (user) {
      loadExercises()
    }
  }, [user, loadExercises])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.exercise_name || !formData.reps || !formData.sets || !formData.total_weight) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive"
      })
      return
    }

    try {
      await blink.db.exercises.create({
        user_id: user!.id,
        exercise_name: formData.exercise_name,
        category: activeTab,
        reps: parseInt(formData.reps),
        sets: parseInt(formData.sets),
        total_weight: parseFloat(formData.total_weight),
        created_at: new Date().toISOString()
      })

      setFormData({ exercise_name: '', reps: '', sets: '', total_weight: '' })
      setShowAddForm(false)
      loadExercises()
      
      toast({
        title: "Success",
        description: "Exercise logged successfully!"
      })
    } catch (error) {
      console.error('Failed to add exercise:', error)
      toast({
        title: "Error",
        description: "Failed to log exercise",
        variant: "destructive"
      })
    }
  }

  const getPreviousExercise = (exerciseName: string, category: 'upper' | 'lower') => {
    return exercises.find(ex => 
      ex.exercise_name.toLowerCase() === exerciseName.toLowerCase() && 
      ex.category === category
    )
  }

  const getFilteredExercises = (category: 'upper' | 'lower') => {
    return exercises.filter(ex => ex.category === category)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <Dumbbell className="h-12 w-12 text-blue-600 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">Loading your workout tracker...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Dumbbell className="h-12 w-12 text-blue-600 mx-auto mb-4" />
            <CardTitle className="text-2xl">Strength Routine Tracker</CardTitle>
            <CardDescription>Please sign in to track your workouts</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => blink.auth.login()} className="w-full">
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const previousExercise = formData.exercise_name ? getPreviousExercise(formData.exercise_name, activeTab) : null

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Dumbbell className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Strength Routine Tracker</h1>
          </div>
          <p className="text-gray-600">Track your progress, one rep at a time</p>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'upper' | 'lower')} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto">
            <TabsTrigger value="upper" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Upper Body
            </TabsTrigger>
            <TabsTrigger value="lower" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Lower Body
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upper" className="space-y-6">
            <WorkoutContent 
              category="upper"
              exercises={getFilteredExercises('upper')}
              showAddForm={showAddForm}
              setShowAddForm={setShowAddForm}
              formData={formData}
              setFormData={setFormData}
              handleSubmit={handleSubmit}
              previousExercise={previousExercise}
              formatDate={formatDate}
            />
          </TabsContent>

          <TabsContent value="lower" className="space-y-6">
            <WorkoutContent 
              category="lower"
              exercises={getFilteredExercises('lower')}
              showAddForm={showAddForm}
              setShowAddForm={setShowAddForm}
              formData={formData}
              setFormData={setFormData}
              handleSubmit={handleSubmit}
              previousExercise={previousExercise}
              formatDate={formatDate}
            />
          </TabsContent>
        </Tabs>
      </div>
      <Toaster />
    </div>
  )
}

interface WorkoutContentProps {
  category: 'upper' | 'lower'
  exercises: Exercise[]
  showAddForm: boolean
  setShowAddForm: (show: boolean) => void
  formData: any
  setFormData: (data: any) => void
  handleSubmit: (e: React.FormEvent) => void
  previousExercise: Exercise | null
  formatDate: (date: string) => string
}

function WorkoutContent({ 
  category, 
  exercises, 
  showAddForm, 
  setShowAddForm, 
  formData, 
  setFormData, 
  handleSubmit, 
  previousExercise,
  formatDate 
}: WorkoutContentProps) {
  return (
    <div className="space-y-6">
      {/* Add Exercise Button */}
      <div className="text-center">
        <Button 
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-blue-600 hover:bg-blue-700"
          size="lg"
        >
          <Plus className="h-5 w-5 mr-2" />
          Log {category === 'upper' ? 'Upper Body' : 'Lower Body'} Exercise
        </Button>
      </div>

      {/* Add Exercise Form */}
      {showAddForm && (
        <Card className="border-blue-200 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Log New Exercise
            </CardTitle>
            <CardDescription>
              Add your {category === 'upper' ? 'upper body' : 'lower body'} exercise details
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="exercise_name">Exercise Name</Label>
                <Input
                  id="exercise_name"
                  placeholder="e.g., Bench Press, Squats"
                  value={formData.exercise_name}
                  onChange={(e) => setFormData({ ...formData, exercise_name: e.target.value })}
                />
              </div>

              {/* Previous Exercise Reference */}
              {previousExercise && (
                <Card className="bg-amber-50 border-amber-200">
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="h-4 w-4 text-amber-600" />
                      <span className="text-sm font-medium text-amber-800">Previous Entry</span>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Sets:</span>
                        <span className="ml-1 font-medium">{previousExercise.sets}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Reps:</span>
                        <span className="ml-1 font-medium">{previousExercise.reps}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Weight:</span>
                        <span className="ml-1 font-medium">{previousExercise.total_weight} lbs</span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      {formatDate(previousExercise.created_at)}
                    </p>
                  </CardContent>
                </Card>
              )}

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sets">Sets</Label>
                  <Input
                    id="sets"
                    type="number"
                    placeholder="3"
                    value={formData.sets}
                    onChange={(e) => setFormData({ ...formData, sets: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reps">Reps</Label>
                  <Input
                    id="reps"
                    type="number"
                    placeholder="10"
                    value={formData.reps}
                    onChange={(e) => setFormData({ ...formData, reps: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="total_weight">Weight (lbs)</Label>
                  <Input
                    id="total_weight"
                    type="number"
                    step="0.5"
                    placeholder="135"
                    value={formData.total_weight}
                    onChange={(e) => setFormData({ ...formData, total_weight: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="submit" className="flex-1">
                  Log Exercise
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowAddForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Exercise History */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Recent {category === 'upper' ? 'Upper Body' : 'Lower Body'} Workouts
        </h3>
        
        {exercises.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Dumbbell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No {category} body exercises logged yet</p>
              <p className="text-sm text-gray-400 mt-2">Start by logging your first exercise above!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {exercises.map((exercise) => (
              <Card key={exercise.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-lg text-gray-900 mb-2">
                        {exercise.exercise_name}
                      </h4>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                          {exercise.sets} sets
                        </Badge>
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          {exercise.reps} reps
                        </Badge>
                        <Badge variant="secondary" className="bg-amber-100 text-amber-800">
                          {exercise.total_weight} lbs
                        </Badge>
                      </div>
                    </div>
                    <div className="text-right text-sm text-gray-500">
                      {formatDate(exercise.created_at)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default App