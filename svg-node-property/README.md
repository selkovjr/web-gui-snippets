# SVG node property test

This test measures the time required to set a payload property on a node during construction.

I attached custom data to nodes using arbitrary object properties and had a suspicion that adding data to nodes might affect rendering times, ever if the properties in question are not involved in rendering. This simple test (tagging each node with a number) had no effect on performance. It also invalidated the view often expressed at the time, that messing with the DOM directly, by setting attributes on nodes, was somehaw bad (no guarantee the attributes would stick, &c).

We succeeded in keeping massive meta-data attached to a large number of SVG nodes.
