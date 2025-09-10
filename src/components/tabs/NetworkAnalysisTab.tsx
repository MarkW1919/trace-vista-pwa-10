import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Network, Plus, Trash2, Download, Users, Link as LinkIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface NetworkNode {
  id: string;
  label: string;
  type: 'person' | 'phone' | 'email' | 'address' | 'social' | 'business';
}

interface NetworkEdge {
  id: string;
  source: string;
  target: string;
  relationship: string;
}

const relationshipTypes = [
  'knows', 'relative', 'spouse', 'parent', 'child', 'sibling',
  'lives_at', 'works_at', 'owns', 'phone', 'email', 'profile',
  'associated_with', 'employed_by', 'business_partner'
];

const nodeTypes = [
  { value: 'person', label: 'Person', color: 'bg-blue-100 text-blue-800' },
  { value: 'phone', label: 'Phone', color: 'bg-green-100 text-green-800' },
  { value: 'email', label: 'Email', color: 'bg-purple-100 text-purple-800' },
  { value: 'address', label: 'Address', color: 'bg-orange-100 text-orange-800' },
  { value: 'social', label: 'Social Media', color: 'bg-pink-100 text-pink-800' },
  { value: 'business', label: 'Business', color: 'bg-yellow-100 text-yellow-800' }
];

// Simple network visualization component (would use a proper graph library in production)
const NetworkVisualization = ({ nodes, edges }: { nodes: NetworkNode[]; edges: NetworkEdge[] }) => {
  const getNodeColor = (type: string) => {
    const nodeType = nodeTypes.find(nt => nt.value === type);
    return nodeType?.color || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="relative h-96 bg-muted/20 rounded-lg border overflow-hidden">
      <div className="absolute inset-4 flex flex-wrap justify-center items-center gap-4">
        {nodes.map((node, index) => (
          <div
            key={node.id}
            className={`relative px-3 py-2 rounded-full text-xs font-medium border ${getNodeColor(node.type)}`}
            style={{
              transform: `translate(${(index % 3) * 100 - 100}px, ${Math.floor(index / 3) * 80 - 80}px)`
            }}
          >
            {node.label}
            <Badge variant="outline" className="ml-1 text-xs">
              {node.type}
            </Badge>
          </div>
        ))}
      </div>
      {nodes.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
          <div className="text-center">
            <Network className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>Add entities to visualize network</p>
          </div>
        </div>
      )}
    </div>
  );
};

export const NetworkAnalysisTab = () => {
  const [nodes, setNodes] = useState<NetworkNode[]>([]);
  const [edges, setEdges] = useState<NetworkEdge[]>([]);
  const [newEntity, setNewEntity] = useState({ label: '', type: 'person' });
  const [newRelationship, setNewRelationship] = useState({
    source: '',
    target: '',
    relationship: 'knows'
  });
  const { toast } = useToast();

  const addEntity = () => {
    if (!newEntity.label.trim()) {
      toast({
        title: "Entity Required",
        description: "Please enter an entity name.",
        variant: "destructive"
      });
      return;
    }

    const entity: NetworkNode = {
      id: `entity_${Date.now()}`,
      label: newEntity.label,
      type: newEntity.type as NetworkNode['type']
    };

    setNodes(prev => [...prev, entity]);
    setNewEntity({ label: '', type: 'person' });
    toast({
      title: "Entity Added",
      description: `Added ${entity.label} to the network.`,
    });
  };

  const addRelationship = () => {
    if (!newRelationship.source || !newRelationship.target) {
      toast({
        title: "Relationship Required",
        description: "Please select both source and target entities.",
        variant: "destructive"
      });
      return;
    }

    if (newRelationship.source === newRelationship.target) {
      toast({
        title: "Invalid Relationship",
        description: "Source and target must be different entities.",
        variant: "destructive"
      });
      return;
    }

    const relationship: NetworkEdge = {
      id: `edge_${Date.now()}`,
      source: newRelationship.source,
      target: newRelationship.target,
      relationship: newRelationship.relationship
    };

    setEdges(prev => [...prev, relationship]);
    setNewRelationship({ source: '', target: '', relationship: 'knows' });
    toast({
      title: "Relationship Added",
      description: `Added ${relationship.relationship} relationship.`,
    });
  };

  const removeEntity = (id: string) => {
    setNodes(prev => prev.filter(n => n.id !== id));
    setEdges(prev => prev.filter(e => e.source !== id && e.target !== id));
    toast({
      title: "Entity Removed",
      description: "Entity and related connections removed.",
    });
  };

  const removeRelationship = (id: string) => {
    setEdges(prev => prev.filter(e => e.id !== id));
    toast({
      title: "Relationship Removed",
      description: "Relationship removed from network.",
    });
  };

  const resetNetwork = () => {
    setNodes([]);
    setEdges([]);
    toast({
      title: "Network Reset",
      description: "All entities and relationships cleared.",
    });
  };

  const exportNetwork = () => {
    const networkData = { nodes, edges, exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(networkData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'network_analysis.json';
    a.click();
    URL.revokeObjectURL(url);
    toast({
      title: "Network Exported",
      description: "Network data exported as JSON file.",
    });
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Network Link Analysis</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Build and visualize networks of entities and their relationships. This helps identify 
          patterns, connections, and potential leads in skip tracing investigations.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Plus className="mr-2 h-5 w-5" />
              Add Entity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="entity-name">Entity Name</Label>
                <Input
                  id="entity-name"
                  placeholder="e.g., John Doe, 555-1234, john@email.com"
                  value={newEntity.label}
                  onChange={(e) => setNewEntity(prev => ({ ...prev, label: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="entity-type">Entity Type</Label>
                <Select
                  value={newEntity.type}
                  onValueChange={(value) => setNewEntity(prev => ({ ...prev, type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {nodeTypes.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={addEntity} className="w-full">
                Add Entity
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <LinkIcon className="mr-2 h-5 w-5" />
              Add Relationship
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label>Source Entity</Label>
                  <Select
                    value={newRelationship.source}
                    onValueChange={(value) => setNewRelationship(prev => ({ ...prev, source: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select source" />
                    </SelectTrigger>
                    <SelectContent>
                      {nodes.map(node => (
                        <SelectItem key={node.id} value={node.id}>
                          {node.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Target Entity</Label>
                  <Select
                    value={newRelationship.target}
                    onValueChange={(value) => setNewRelationship(prev => ({ ...prev, target: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select target" />
                    </SelectTrigger>
                    <SelectContent>
                      {nodes.map(node => (
                        <SelectItem key={node.id} value={node.id}>
                          {node.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Relationship Type</Label>
                <Select
                  value={newRelationship.relationship}
                  onValueChange={(value) => setNewRelationship(prev => ({ ...prev, relationship: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {relationshipTypes.map(type => (
                      <SelectItem key={type} value={type}>
                        {type.replace('_', ' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button 
                onClick={addRelationship}
                disabled={nodes.length < 2}
                className="w-full"
              >
                Add Relationship
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <Network className="mr-2 h-5 w-5" />
              Network Visualization
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" onClick={exportNetwork} disabled={nodes.length === 0}>
                <Download className="mr-1 h-3 w-3" />
                Export
              </Button>
              <Button variant="outline" size="sm" onClick={resetNetwork} disabled={nodes.length === 0}>
                <Trash2 className="mr-1 h-3 w-3" />
                Reset
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <NetworkVisualization nodes={nodes} edges={edges} />
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{nodes.length}</div>
              <p className="text-sm text-muted-foreground">Entities</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-accent">{edges.length}</div>
              <p className="text-sm text-muted-foreground">Relationships</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-success">
                {nodes.length > 0 ? Math.round((edges.length / Math.max(nodes.length - 1, 1)) * 100) : 0}%
              </div>
              <p className="text-sm text-muted-foreground">Connectivity</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {nodes.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="mr-2 h-5 w-5" />
                Entities ({nodes.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {nodes.map((node) => {
                  const nodeType = nodeTypes.find(nt => nt.value === node.type);
                  return (
                    <div key={node.id} className="flex items-center justify-between p-2 border rounded">
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className={nodeType?.color}>
                          {nodeType?.label}
                        </Badge>
                        <span className="text-sm">{node.label}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeEntity(node.id)}
                        className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <LinkIcon className="mr-2 h-5 w-5" />
                Relationships ({edges.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {edges.map((edge) => {
                  const sourceNode = nodes.find(n => n.id === edge.source);
                  const targetNode = nodes.find(n => n.id === edge.target);
                  return (
                    <div key={edge.id} className="flex items-center justify-between p-2 border rounded text-sm">
                      <div>
                        <span className="font-medium">{sourceNode?.label}</span>
                        <span className="text-muted-foreground mx-2">
                          {edge.relationship.replace('_', ' ')}
                        </span>
                        <span className="font-medium">{targetNode?.label}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeRelationship(edge.id)}
                        className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <h4 className="font-semibold mb-2">Analysis Tips:</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Look for central entities with many connections (high centrality)</li>
            <li>• Identify clusters of related entities</li>
            <li>• Missing connections may indicate hidden relationships</li>
            <li>• In production, tools like Gephi or Cytoscape provide advanced visualizations</li>
            <li>• Export data for analysis in specialized network analysis software</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};