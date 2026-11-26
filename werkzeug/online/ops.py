# -*- coding: utf-8 -*-
"""Scherbenwelt · Änderungslisten (V10.96). Gleiche Logik wie ops.js (Pfad: Schlüssel, Position, {"id":…})."""
import json,copy,math
def _t(x):
    if x is None: return 'n'
    if isinstance(x,bool): return 'boolean'
    if isinstance(x,(int,float)): return 'number'
    if isinstance(x,str): return 'string'
    if isinstance(x,list): return 'a'
    if isinstance(x,dict): return 'o'
    return 'x'
def _ids(a):
    if not a: return False
    s=set()
    for x in a:
        if not isinstance(x,dict) or 'id' not in x or not isinstance(x['id'],(str,int,float)) or isinstance(x['id'],bool): return False
        k=(type(x['id']).__name__ if not isinstance(x['id'],(int,float)) else 'n',x['id'])
        if k in s: return False
        s.add(k)
    return True
def _eq(a,b):
    if _t(a)!=_t(b): return False
    if _t(a)=='number': return a==b or (isinstance(a,float) and isinstance(b,float) and math.isnan(a) and math.isnan(b))
    return a==b
def diff(a,b,p=None,out=None):
    p=p or [];out=[] if out is None else out
    ta,tb=_t(a),_t(b)
    if ta!=tb: out.append({'p':p,'v':b});return out
    if ta=='o':
        for k in a:
            if k not in b: out.append({'p':p+[k],'d':1})
        for k in b:
            if k not in a: out.append({'p':p+[k],'v':b[k]})
            else: diff(a[k],b[k],p+[k],out)
        return out
    if ta=='a':
        if _ids(a) and _ids(b):
            ma={x['id']:x for x in a};mb={x['id'] for x in b}
            for x in a:
                if x['id'] not in mb: out.append({'p':p+[{'id':x['id']}],'d':1})
            for x in b:
                if x['id'] not in ma: out.append({'p':p+[{'id':x['id']}],'v':x})
                else: diff(ma[x['id']],x,p+[{'id':x['id']}],out)
            return out
        if len(a)==len(b):
            for i in range(len(a)): diff(a[i],b[i],p+[i],out)
            return out
        out.append({'p':p,'v':b});return out
    if not _eq(a,b): out.append({'p':p,'v':b})
    return out
def _seg(c,s):
    if isinstance(s,dict):
        if not isinstance(c,list): return None
        for i,x in enumerate(c):
            if isinstance(x,dict) and x.get('id')==s.get('id') and _t(x.get('id'))==_t(s.get('id')): return ('a',i,True)
        return ('a',-1,True)
    if isinstance(s,int) and not isinstance(s,bool):
        return ('a',s,False) if isinstance(c,list) else None
    return ('o',s,False) if isinstance(c,dict) else None
def apply1(root,op):
    p=op.get('p')
    if not isinstance(p,list) or not p: return False
    c=root
    for s in p[:-1]:
        r=_seg(c,s)
        if r is None: return False
        if r[0]=='a':
            if r[1]<0 or r[1]>=len(c): return False
            c=c[r[1]]
        else:
            if r[1] not in c: return False
            c=c[r[1]]
    r=_seg(c,p[-1])
    if r is None: return False
    v=None if op.get('d') else copy.deepcopy(op.get('v'))
    if r[0]=='a':
        i=r[1]
        if op.get('d'):
            if 0<=i<len(c): del c[i]
            return True
        if 0<=i<len(c): c[i]=v
        elif r[2] or i==len(c): c.append(v)
        else: return False
        return True
    if op.get('d'): c.pop(r[1],None);return True
    c[r[1]]=v;return True
def apply(root,ops):
    return sum(1 for op in (ops or []) if apply1(root,op))
def _segeq(a,b):
    if isinstance(a,dict): return isinstance(b,dict) and a.get('id')==b.get('id')
    return not isinstance(b,dict) and a==b and type(a)==type(b) or (isinstance(a,(int,float)) and isinstance(b,(int,float)) and not isinstance(a,bool) and a==b)
def prefix(pre,p):
    return len(pre)<=len(p) and all(_segeq(pre[i],p[i]) for i in range(len(pre)))
def get(root,p):
    """Wert am Pfad oder (False,None) wenn nicht vorhanden"""
    c=root
    for s in p:
        r=_seg(c,s)
        if r is None: return (False,None)
        if r[0]=='a':
            if r[1]<0 or r[1]>=len(c): return (False,None)
            c=c[r[1]]
        else:
            if r[1] not in c: return (False,None)
            c=c[r[1]]
    return (True,c)
