Tend the current branch of VES. Check the last CI run on the branch head: if `verify`, `gate` or `probes` is red, pull the
failing job log, name the failing line, and fix it with a minimal, anchored edit that keeps G0 GREEN and the verifier
PASS — then push. If review comments arrived, address each with the same discipline and resolve the thread. Never write a
freeze manifest or an egress baseline; never rewrite history; never delete a remote ref. If everything is green and quiet,
say so in one line and wait longer next time.
