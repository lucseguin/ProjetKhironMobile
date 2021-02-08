
import React from 'react';

export interface SectionJSON {
    _id:    string;
    label:  string;
    description: string;
    layout : string;
  }
  
  export interface FloorJSON {
    _id:    string;
    label:  string;
    description: string;
    useSections: boolean;
    layout : string;
    sections: SectionJSON[];
  }

  export interface Section {
    _id:    string;
    label:  string;
    description: string;
    layout : string;
  }

  export interface Floor {
    _id:    string;
    label:  string;
    description: string;
    useSections: boolean;
    layout : string;
    sections: Section[];
  }

  export function encodeFloor(floor: Floor): FloorJSON {
    return {
        _id:   floor._id,
        label:  floor.label,
        description: floor.description,
        useSections: floor.useSections,
        layout : floor.layout,
        sections: [...floor.sections],
    };
  }
  
  export function decodeFloor(json: FloorJSON): Floor {
    return {
        _id:   json._id,
        label:  json.label,
        description: json.description,
        useSections: json.useSections,
        layout : json.layout,
        sections: [...json.sections],
    };
  }